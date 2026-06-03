import { Link } from "react-router-dom";

interface FormHeaderProps {
  title: string;
  backTo?: string;
}

export function FormHeader({ title, backTo = "/contact" }: FormHeaderProps) {
  return (
    <header className="bp-form-header">
      <Link to={backTo} className="bp-back-btn" aria-label="Retour">
        ←
      </Link>
      <h1 className="bp-form-header__title">{title}</h1>
    </header>
  );
}
