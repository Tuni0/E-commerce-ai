import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";

export default function PaymentCancel() {
  const navigate = useNavigate();

  useEffect(() => {
    navigate("/", { replace: true }); // od razu przenosi do homepage
  }, [navigate]);

  return null;
}
