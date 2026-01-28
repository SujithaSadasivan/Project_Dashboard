# backend/app/api/datasets.py

from fastapi import APIRouter, UploadFile, HTTPException, File, Depends
from sqlalchemy.orm import Session
import pandas as pd
from io import BytesIO

from app.core.database import get_db
from app.models.dataset import Dataset
from app.models.dataset_column import DatasetColumn
from app.models.dataset_row import DatasetRow
from app.utils.type_inference import infer_column_type
from fastapi.responses import StreamingResponse
from fastapi import Query
import json

router = APIRouter(prefix="/datasets", tags=["Datasets"])

@router.get("/")
def list_datasets(db: Session = Depends(get_db)):
    datasets = db.query(Dataset).order_by(Dataset.id.desc()).all()
    return [
        {
            "id": d.id,
            "name": d.name,
            "type": d.file_type,
            "size": None,
            "status": "Completed",
            "date": d.created_at.strftime("%Y-%m-%d") if d.created_at else None,
            "records": d.row_count
        }
        for d in datasets
    ]

# 🔹 PREVIEW DATA (EYE BUTTON)
@router.get("/{dataset_id}/excel-view")
def get_excel_view(dataset_id: int, db: Session = Depends(get_db)):
    dataset = db.query(Dataset).filter(Dataset.id == dataset_id).first()
    if not dataset:
        raise HTTPException(status_code=404, detail="Dataset not found")

    columns = (
        db.query(DatasetColumn)
        .filter(DatasetColumn.dataset_id == dataset_id)
        .order_by(DatasetColumn.id)
        .all()
    )

    rows = (
        db.query(DatasetRow)
        .filter(DatasetRow.dataset_id == dataset_id)
        .all()
    )

    headers = [c.column_name for c in columns]

    data = []
    for r in rows:
        data.append([r.row_data.get(h, "") for h in headers])

    return {
        "id": dataset.id,
        "name": dataset.name,
        "type": dataset.file_type,
        "size": dataset.row_count,
        "date": dataset.created_at.strftime("%Y-%m-%d"),
        "uploadedBy": "System",
        "fileData": {
            "sheets": [
                {
                    "name": "Sheet1",
                    "headers": headers,
                    "data": data
                }
            ]
        }
    }





# 🔹 DOWNLOAD DATA AGAIN
@router.get("/{dataset_id}/download")
def download_dataset(dataset_id: int, db: Session = Depends(get_db)):
    dataset = db.query(Dataset).filter_by(id=dataset_id).first()
    rows = db.query(DatasetRow).filter_by(dataset_id=dataset_id).all()

    if not dataset:
        return {"error": "Not found"}

    df = pd.DataFrame([r.row_data for r in rows])

    stream = BytesIO()
    if dataset.file_type.lower() == "csv":
        df.to_csv(stream, index=False)
        media_type = "text/csv"
        filename = dataset.name
    else:
        df.to_excel(stream, index=False)
        media_type = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        filename = dataset.name

    stream.seek(0)

    return StreamingResponse(
        stream,
        media_type=media_type,
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )


# 🔹 CHART DATA API
@router.get("/{dataset_id}/chart")
def get_chart_data(
    dataset_id: int,
    x: str = Query(...),
    y: str = Query(...),
    db: Session = Depends(get_db),
):
    rows = (
        db.query(DatasetRow)
        .filter_by(dataset_id=dataset_id)
        .all()
    )

    x_vals = []
    y_vals = []

    for r in rows:
        row = r.row_data
        if x in row and y in row:
            try:
                x_vals.append(row[x])
                y_vals.append(float(row[y]))
            except:
                pass  # skip invalid rows

    return {
        "x": x_vals,
        "y": y_vals,
        "count": len(x_vals)
    }

@router.post("/upload")
async def upload_dataset(
    file: UploadFile = File(...),
    industry: str | None = None,
    db: Session = Depends(get_db)
):
    content = await file.read()

    if file.filename.endswith(".csv"):
        df = pd.read_csv(BytesIO(content))
    else:
        df = pd.read_excel(BytesIO(content))

    df = df.fillna("")

    dataset = Dataset(
        name=file.filename,
        industry=industry,
        file_type=file.filename.split(".")[-1].upper(),
        row_count=len(df)
    )

    db.add(dataset)
    db.commit()
    db.refresh(dataset)

    # Save column metadata
    for col in df.columns:
        db.add(DatasetColumn(
            dataset_id=dataset.id,
            column_name=col,
            data_type=infer_column_type(df[col])
        ))

    db.commit()

    # 🚀 BULK INSERT (FIXES 60% STUCK)
    rows = [
        DatasetRow(dataset_id=dataset.id, row_data=row.to_dict())
        for _, row in df.iterrows()
    ]

    db.bulk_save_objects(rows)
    db.commit()

    return {
        "dataset_id": dataset.id,
        "rows": len(df),
        "columns": list(df.columns)
    }


# ✅ THIS IS WHERE YOUR QUESTIONED CODE GOES
@router.get("/{dataset_id}/schema")
def get_schema(dataset_id: int, db: Session = Depends(get_db)):
    return db.query(DatasetColumn).filter_by(dataset_id=dataset_id).all()


@router.get("/{dataset_id}/data")
def get_data(dataset_id: int, db: Session = Depends(get_db)):
    rows = (
        db.query(DatasetRow)
        .filter_by(dataset_id=dataset_id)
        .limit(1000)
        .all()
    )
    return [r.row_data for r in rows]

@router.delete("/{dataset_id}")
def delete_dataset(dataset_id: int, db: Session = Depends(get_db)):
    dataset = db.query(Dataset).filter(Dataset.id == dataset_id).first()

    if not dataset:
        return {"error": "Dataset not found"}

    # Delete child rows first (FK safety)
    db.query(DatasetRow).filter(DatasetRow.dataset_id == dataset_id).delete()
    db.query(DatasetColumn).filter(DatasetColumn.dataset_id == dataset_id).delete()

    db.delete(dataset)
    db.commit()

    return {"message": "Dataset deleted successfully"}

