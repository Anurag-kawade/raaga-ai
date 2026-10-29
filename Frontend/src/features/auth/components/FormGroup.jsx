
import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";

const FormGroup = ({ label, placeholder, value, onChange }) => {
  const [showPassword, setShowPassword] = useState(false);

  const isPassword = label.toLowerCase() === "password";

  return (
    <div className="form-group">
      <label htmlFor={label}>{label}</label>

      <div className={isPassword ? "input-wrapper password-wrapper" : "input-wrapper"}>
        <input
          type={
            isPassword
              ? showPassword
                ? "text"
                : "password"
              : "text"
          }
          id={label}
          name={label}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          required
        />

        {isPassword && (
          <button
            type="button"
            className="password-toggle"
            onClick={() => setShowPassword((prev) => !prev)}
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
          </button>
        )}
      </div>
    </div>
  );
};

export default FormGroup;
