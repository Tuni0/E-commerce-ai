import React from "react";
import PropTypes from "prop-types";

const RouteGuard = ({ user, children }) => {
  return user ? (
    children
  ) : (
    <div id="guard" className={`z-0 mt-4  font-abeezee font-semibold text-2xl`}>
      <p>{/*Please register or login to your account to see data!!*/}</p>
    </div>
  );
};

RouteGuard.propTypes = {
  user: PropTypes.object,
  children: PropTypes.node,
};

export default RouteGuard;
