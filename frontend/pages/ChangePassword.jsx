import React from 'react';

const ChangePassword = () => {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-brand-text-primary">Change Password</h1>
      
      <div className="bg-brand-surface p-6 rounded-lg shadow-sm max-w-2xl mx-auto border border-brand-border">
        <form className="space-y-6">
          <div>
            <label htmlFor="new-password" className="block text-sm font-medium text-brand-text-secondary mb-2">New Password*</label>
            <input
              type="password"
              id="new-password"
              placeholder="New Password"
              className="w-full bg-white border border-brand-border text-brand-text-primary rounded-lg p-3 focus:ring-brand-accent focus:border-brand-accent"
            />
          </div>
          <div>
            <label htmlFor="reenter-password" className="block text-sm font-medium text-brand-text-secondary mb-2">Re-Enter Password*</label>
            <input
              type="password"
              id="reenter-password"
              placeholder="Re-Enter Password"
              className="w-full bg-white border border-brand-border text-brand-text-primary rounded-lg p-3 focus:ring-brand-accent focus:border-brand-accent"
            />
          </div>
          <div>
            <button
              type="submit"
              className="bg-brand-accent hover:bg-brand-accent-hover text-white font-bold py-2 px-6 rounded-lg transition-colors duration-200"
            >
              Submit
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ChangePassword;