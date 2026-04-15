import React from "react";

const Home = () => {
  return (
    <div className="container">
      <div className="form-horizon-btw p25">
        <div className="form-horizon-start">
          <img alt="home pic" src="home.png" className="patient-pic" />
          <h1 className="page-heading">My clinic</h1>
        </div>
      </div>
      <div className="p25">
        <div className="card-base p-6">
          <h2 className="text-xl font-semibold text-slate-900">Welcome to Medryon</h2>
          <p className="mt-3 text-slate-600">
            Use the navigation above to add patients, view history, and manage your clinic data.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Home;
