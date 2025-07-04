import { Link, useLocation, useNavigate } from "react-router-dom";

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <div className="navbar absolute top-0 left-0 right-0 w-[90%] mx-auto z-50">
      <nav className="flex items-center justify-between mt-8">
        <h2 className="cursor-pointer" onClick={() => navigate("/")}>
          Eazi<span className="text-gradient">Flix</span>
        </h2>
        {location.pathname === "/" && (
          <Link
            to="/login"
            className="bg-gradient-to-r from-[#D6C7FF] to-[#AB8BFF] text-white font-normal px-4 py-2 rounded-[5px]  hover:cursor-pointer hover:shadow-2xl hover:from-[#AB8BFF] hover:to-[#8B5FFF] transform hover:scale-105 transition-all duration-300"
          >
            Login In
          </Link>
        )}
      </nav>
    </div>
  );
};

export default Navbar;
