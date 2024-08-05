import React, { useState } from 'react';
import axios from 'axios';
import storeToken from '../utils/storeToken';

function Otp({ customerData, setShowOtp, setToken, setCustomerDetails }) {
  const [otp, setOtp] = useState(new Array(6).fill(''));

  const handleChange = (event, index) => {
    const { value } = event.target;
    console.log("adfadf:", value)
    // Ensure value is a digit and within the input length
    if (/^\d$/.test(value)) {
      const newOtp = [...otp];
      newOtp[index] = value;
      setOtp(newOtp);
  
      // Focus next input if there is one
      const nextInput = event.target.nextElementSibling;
      if (value && nextInput) {
        nextInput.focus();
      }
    }
  };
  
  const handleKeyDown = (event, index) => {
    if (event.key === 'Backspace') {
      const newOtp = [...otp];
      newOtp[index] = '';
      setOtp(newOtp);
  
      // Focus previous input if there is one
      const prevInput = event.target.previousElementSibling;
      if (prevInput) {
        prevInput.focus();
      }
    }
  };
  

  const handleSubmit = async (event) => {
    event.preventDefault();
    const otpCode = otp.join('');
    const { email } = customerData;

    try {
      const response = await axios.post(`${process.env.REACT_APP_AUTH_MICROSERVICE_URL}/otp/verify/customer`, {
        email,
        otp: otpCode
      });

      if (response.status === 200) { // Check for successful response
        // Handle successful verification
        setShowOtp(false);
        console.log("customerasdf", response);
        setCustomerDetails(response.data.customer);
        storeToken(response.data.token);
        setToken(localStorage.getItem('token'));
        localStorage.setItem("customerDetails", JSON.stringify(response.data.customer));
      } else {
        console.log("Verification failed");
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  return (
    <div className="relative flex min-h-screen flex-col justify-center overflow-hidden bg-gray-50 py-12">
      <div className="relative bg-white px-6 pt-10 pb-9 shadow-xl mx-auto w-full max-w-lg rounded-2xl">
        <div className="mx-auto flex w-full max-w-md flex-col space-y-16">
          <div className="flex flex-col items-center justify-center text-center space-y-2">
            <div className="font-semibold text-3xl">
              <p>Email Verification</p>
            </div>
            <div className="flex flex-row text-sm font-medium text-gray-400">
              <p>We have sent a code to your email <span className='text-green-500'>{customerData.email}</span></p>
            </div>
          </div>

          <div>
            <form onSubmit={handleSubmit}>
              <div className="flex flex-col space-y-16">
                <div className="flex flex-row items-center justify-between mx-auto w-full max-w-xs">
                  {otp.map((data, index) => (
                    <div key={index} className="w-12 h-12">
                      <input
                        className="w-full h-full flex text-black items-center justify-center text-center px-4 outline-none border border-gray-300 text-lg bg-white focus:bg-gray-50 focus:ring-1 ring-blue-700"
                        // type="text"
                        name="otp"
                        maxLength="1"
                        value={data}
                        onChange={(e) => handleChange(e, index)}
                        onKeyDown={(e) => handleKeyDown(e, index)}
                        onFocus={(e) => e.target.select()}
                      />
                    </div>
                  ))}
                </div>

                <div className="flex flex-col space-y-5">
                  <div>
                    <button type="submit" className="flex-row items-center justify-center text-center w-full border rounded-xl outline-none py-2 bg-blue-700 border-none text-white text-sm shadow-sm">
                      Verify Account
                    </button>
                  </div>

                  <div className="flex flex-row items-center justify-center text-center text-sm font-medium space-x-1 text-gray-500">
                    <p>Didn't receive code?</p>
                    <a className="flex flex-row items-center text-blue-600" href="#" target="_blank" rel="noopener noreferrer">Resend</a>
                  </div>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Otp;
