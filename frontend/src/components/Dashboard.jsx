import { useState, useEffect } from 'react'
import axios from 'axios'
import { useNavigate } from 'react-router-dom'

const API_BASE_URL = "http://localhost:8000/api"

const Dashboard = ({ onLogout }) => {
  const [user, setUser] = useState(null)
  const [teamsData, setTeamsData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [expandedTeams, setExpandedTeams] = useState({})
  const navigate = useNavigate()

  useEffect(() => {
    const fetchDashboardData = async () => {
      const token = localStorage.getItem('token')
      if (!token) {
        navigate('/login')
        return
      }

      try {
        const response = await axios.get(`${API_BASE_URL}/dashboard-data`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })
        setUser(response.data.user)
        setTeamsData(response.data.teams)
        
        // Initialize expanded state for teams
        const initialExpanded = {}
        if (response.data.teams && response.data.teams.Teams) {
          Object.keys(response.data.teams.Teams).forEach(team => {
            initialExpanded[team] = false
          })
          setExpandedTeams(initialExpanded)
        }
      } catch (err) {
        console.error("Dashboard error:", err)
        setError(err.response?.data?.detail || 'Failed to load dashboard data')
        if (err.response?.status === 401) {
          onLogout()
        }
      } finally {
        setLoading(false)
      }
    }

    fetchDashboardData()
  }, [navigate, onLogout])

  const toggleTeam = (teamName) => {
    setExpandedTeams(prev => ({
      ...prev,
      [teamName]: !prev[teamName]
    }))
  }

  const handleLogout = () => {
    onLogout()
    navigate('/login')
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 p-4">
      {/* Header */}
      <header className="bg-white rounded-2xl shadow-lg mb-6 p-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Team Dashboard</h1>
            {user && (
              <p className="text-gray-600 mt-2">
                Welcome back, <span className="font-semibold text-purple-600">{user.username}</span>!
              </p>
            )}
          </div>
          <button
            onClick={handleLogout}
            className="px-6 py-2 bg-gradient-to-r from-red-500 to-pink-500 text-white font-medium rounded-lg hover:from-red-600 hover:to-pink-600 transition-all duration-200 shadow-md hover:shadow-lg"
          >
            Logout
          </button>
        </div>
      </header>

      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6 rounded-r-lg">
          <p className="text-red-700">{error}</p>
        </div>
      )}

      {/* Tree Hierarchy */}
      <div className="max-w-6xl mx-auto">
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-2xl font-bold text-gray-800">Teams Hierarchy</h2>
            <p className="text-gray-600 mt-2">Click on teams to expand/collapse</p>
          </div>

          <div className="p-6">
            {teamsData && teamsData.Teams && (
              <div className="space-y-4">
                <div className="flex items-center space-x-3 mb-6">
                  <div className="w-4 h-4 bg-purple-500 rounded-full"></div>
                  <h3 className="text-xl font-bold text-gray-800">Teams</h3>
                </div>

                <div className="space-y-2 ml-7">
                  {Object.entries(teamsData.Teams).map(([teamName, subTeams]) => (
                    <div key={teamName} className="border-l-2 border-purple-200 pl-4">
                      <button
                        onClick={() => toggleTeam(teamName)}
                        className="flex items-center space-x-3 text-left w-full p-3 hover:bg-purple-50 rounded-lg transition-colors duration-200"
                      >
                        <div className={`transform transition-transform duration-200 ${expandedTeams[teamName] ? 'rotate-90' : ''}`}>
                          <svg className="w-5 h-5 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </div>
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-800 text-lg">{teamName}</h4>
                          <p className="text-sm text-gray-600">{subTeams.length} sub-teams</p>
                        </div>
                      </button>

                      {expandedTeams[teamName] && (
                        <div className="ml-8 mt-2 space-y-2">
                          {subTeams.map((subTeam, index) => (
                            <div
                              key={`${teamName}-${index}`}
                              className="flex items-center space-x-3 p-3 hover:bg-blue-50 rounded-lg transition-colors duration-200"
                            >
                              <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                              <span className="text-gray-700">{subTeam}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mt-6">
          {teamsData && teamsData.Teams && Object.entries(teamsData.Teams).map(([teamName, subTeams]) => (
            <div
              key={teamName}
              className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow duration-200 border-t-4 border-purple-500"
            >
              <h4 className="font-bold text-gray-800 text-lg mb-2">{teamName}</h4>
              <p className="text-3xl font-bold text-purple-600 mb-2">{subTeams.length}</p>
              <p className="text-sm text-gray-600">Sub-teams</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default Dashboard