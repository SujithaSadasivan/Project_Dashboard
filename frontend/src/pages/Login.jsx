import React from 'react';
import LoginForm from '../components/LoginForm';

const Login = () => {
  return (
    <div className="h-screen flex items-center justify-center bg-cover bg-center" 
         style={{backgroundImage: 'url(https://png.pngtree.com/png-clipart/20221006/original/pngtree-red-gradient-line-combination-geometric-distortion-elements-free-psd-png-image_8658889.png)'}}>
      {/* Semi-transparent overlay */}
      <div className="absolute inset-0 bg-black/5"></div>
      
      {/* Main Container */}
      <div className="relative w-full max-w-2xl bg-white/95 backdrop-blur-sm rounded-3xl shadow-2xl overflow-hidden border border-white/20">
        <div className="flex flex-col lg:flex-row">
          
          {/* Left side - Login Form */}
          <div className="w-full lg:w-1/2 p-4 md:p-6">
            <div className="h-full flex items-center">
              <div className="w-full">
                <LoginForm />
              </div>
            </div>
          </div>

          {/* Right side - Image Container with same background */}
          <div className="w-full lg:w-1/2 h-40 lg:h-auto bg-cover bg-center" 
               style={{backgroundImage: 'url(https://png.pngtree.com/png-clipart/20221006/original/pngtree-red-gradient-line-combination-geometric-distortion-elements-free-psd-png-image_8658889.png)'}}>
            <div className="h-full w-full flex items-center justify-center bg-white/30 backdrop-blur-[1px]">
              {/* Optional: You can add an overlay image on top of the gradient */}
              {/* <img 
                src="https://tse3.mm.bing.net/th/id/OIP.CgPeJOKLZ8-E1A42glh80AHaEK?pid=Api&h=220&P=0" 
                alt="Dashboard Illustration"
                className="w-4/5 h-4/5 object-contain"
              /> */}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default Login;