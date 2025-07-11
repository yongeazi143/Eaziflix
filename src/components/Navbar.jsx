import { Link, useLocation, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import {
  Search,
  Menu,
  X,
  User,
  Settings,
  LogOut,
  FilterIcon,
  FilterX,
  Heart,
  Bookmark,
} from "lucide-react";
import MovieFilters from "./MovieFilters";
import Backdrop from "./Backdrop";

const Navbar = ({
  searchTerm,
  setSearchTerm,
  user,
  onLogout,
  handleFiltersChange,
  loading,
  currentFilters,
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);

  // Handle scroll effect for dynamic navbar background
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const isDashboard = location.pathname === "/dashboard";
  const isLandingPage = location.pathname === "/";

  // Handle filter modal toggle
  const handleFilterToggle = () => {
    setIsMenuOpen(false);
    setIsFilterModalOpen(!isFilterModalOpen);
  };

  // Handle filter modal close
  const handleFilterClose = () => {
    setIsFilterModalOpen(false);
  };

  // Handle mobile menu toggle
  const handleMobileMenuToggle = () => {
    setIsUserMenuOpen(false);
    setIsFilterModalOpen(false);
    setIsMenuOpen(!isMenuOpen);
  };

  // Handle user menu toggle
  const handleUserMenuToggle = () => {
    setIsMenuOpen(false);
    setIsFilterModalOpen(false);
    setIsUserMenuOpen(!isUserMenuOpen);
  };

  // Handle backdrop click - closes any open modal/menu
  const handleBackdropClick = () => {
    setIsMenuOpen(false);
    setIsUserMenuOpen(false);
  };

  // Handle search functionality
  const handleSearch = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      setIsMenuOpen(false);
    }
  };

  // Check if any filters are active
  const activeFilters =
    currentFilters?.genres?.length > 0 ||
    currentFilters?.releaseYear ||
    currentFilters?.yearRange?.min ||
    currentFilters?.yearRange?.max ||
    currentFilters?.rating?.min ||
    currentFilters?.rating?.max ||
    currentFilters?.sortBy !== "popularity.desc" ||
    currentFilters?.includeAdult;

  // Check if any modal/menu is open
  const isAnyModalOpen = isMenuOpen || isUserMenuOpen || isFilterModalOpen;

  return (
    <div className="relative">
      <Backdrop visible={isAnyModalOpen} onClick={handleBackdropClick} />

      {/* Fixed Navbar */}
      <div
        className={`fixed top-0 left-0 right-0 w-full z-50 transition-all duration-300 ${
          isScrolled
            ? "backdrop-blur-lg shadow-lg backdrop-brightness-75"
            : "bg-transparent"
        }`}
      >
        <nav className="flex items-center justify-between py-4 px-6 max-w-7xl mx-auto">
          {/* Logo */}
          <div
            className="flex items-center justify-center gap-1 cursor-pointer hover:scale-105 transition-transform duration-200"
            onClick={() => navigate("/")}
          >
            <img src="./logo.png" alt="Logo" className="w-8 h-8" />
            <h2 className="text-2xl font-bold">
              Eazi<span className="text-gradient">Flix</span>
            </h2>
          </div>

          {/* Search Bar - Only show on dashboard */}
          {isDashboard && (
            <div className="hidden md:flex flex-1 mx-8 max-w-xl">
              <div className="relative w-full">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-purple-400 w-4 h-4" />
                  <button
                    className={`absolute right-3 top-1/2 transform -translate-y-1/2 cursor-pointer transition-all duration-200 ${
                      activeFilters
                        ? "text-purple-300 hover:text-purple-200 scale-110"
                        : "text-purple-400 hover:text-purple-300 hover:scale-110"
                    }`}
                    onClick={handleFilterToggle}
                    title="Filter movies"
                  >
                    {activeFilters ? (
                      <FilterX className="w-4 h-4" />
                    ) : (
                      <FilterIcon className="w-4 h-4" />
                    )}
                  </button>
                  <input
                    type="text"
                    value={searchTerm || ""}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onKeyDown={handleSearch}
                    placeholder="Search for movies..."
                    className="w-full pl-10 pr-10 py-2 bg-light-100/5 border border-purple-500/30 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-400 transition-all duration-200 shadow-inner"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Right side content */}
          <div className="flex items-center space-x-4">
            {/* User Menu - When logged in */}
            {user && (
              <div className="relative">
                <button
                  className="hidden user-menu-button md:flex items-center space-x-2 text-white hover:text-purple-400 transition-colors cursor-pointer"
                  onClick={handleUserMenuToggle}
                >
                  <div className="w-8 h-8 bg-gradient-to-r from-[#D6C7FF] to-[#AB8BFF] rounded-full flex items-center justify-center transition-transform duration-200 hover:scale-110">
                    <User className="w-4 h-4 text-white" />
                  </div>
                  <span className="hidden sm:block">{user.name || "User"}</span>
                </button>

                {/* Enhanced User Dropdown with animations */}
                <div
                  className={`absolute top-14 right-0 w-80 bg-gradient-to-br from-gray-900/95 to-gray-800/95 backdrop-blur-md border border-purple-500/30 rounded-xl shadow-2xl shadow-purple-500/20 z-60 transition-all duration-300 ease-out ${
                    isUserMenuOpen
                      ? "opacity-100 visible transform translate-y-0 scale-100"
                      : "opacity-0 invisible transform -translate-y-2 scale-95"
                  }`}
                >
                  <div className="px-6 py-6 space-y-5">
                    {/* Dashboard Navigation Links */}
                    {isDashboard && (
                      <div className="space-y-3">
                        <div className="text-xs font-semibold text-purple-300 uppercase tracking-wider mb-3">
                          Quick Links
                        </div>
                        <Link
                          to="/watchlist"
                          className="flex items-center space-x-3 text-white hover:text-purple-300 transition-all duration-200 py-3 px-4 rounded-lg hover:bg-gray-800/50 border border-transparent hover:border-purple-500/20 group transform hover:translate-x-1"
                          onClick={() => setIsUserMenuOpen(false)}
                        >
                          <Bookmark className="w-5 h-5 group-hover:scale-110 transition-transform" />
                          <span className="font-medium">Watchlist</span>
                        </Link>
                        <Link
                          to="/favourite"
                          className="flex items-center space-x-3 text-white hover:text-purple-300 transition-all duration-200 py-3 px-4 rounded-lg hover:bg-gray-800/50 border border-transparent hover:border-purple-500/20 group transform hover:translate-x-1"
                          onClick={() => setIsUserMenuOpen(false)}
                        >
                          <Heart className="w-5 h-5 group-hover:scale-110 transition-transform" />
                          <span className="font-medium">Favorites</span>
                        </Link>
                      </div>
                    )}

                    {/* Dashboard User Menu */}
                    {user && (
                      <div className="border-t border-gray-700/50 pt-5 space-y-3">
                        <div className="text-xs font-semibold text-purple-300 uppercase tracking-wider mb-3">
                          Account
                        </div>
                        <Link
                          to="/profile"
                          className="flex items-center space-x-3 text-white hover:text-purple-300 transition-all duration-200 py-3 px-4 rounded-lg hover:bg-gray-800/50 border border-transparent hover:border-purple-500/20 group transform hover:translate-x-1"
                          onClick={() => setIsUserMenuOpen(false)}
                        >
                          <User className="w-5 h-5 group-hover:scale-110 transition-transform" />
                          <span className="font-medium">Profile</span>
                        </Link>
                        <Link
                          to="/settings"
                          className="flex items-center space-x-3 text-white hover:text-purple-300 transition-all duration-200 py-3 px-4 rounded-lg hover:bg-gray-800/50 border border-transparent hover:border-purple-500/20 group transform hover:translate-x-1"
                          onClick={() => setIsUserMenuOpen(false)}
                        >
                          <Settings className="w-5 h-5 group-hover:scale-110 transition-transform" />
                          <span className="font-medium">Settings</span>
                        </Link>
                        <button
                          onClick={() => {
                            setIsUserMenuOpen(false);
                            onLogout();
                          }}
                          className="flex items-center space-x-3 text-white hover:text-red-400 transition-all duration-200 py-3 px-4 rounded-lg hover:bg-red-900/20 border border-transparent hover:border-red-500/20 w-full text-left group transform hover:translate-x-1"
                        >
                          <LogOut className="w-5 h-5 group-hover:scale-110 transition-transform" />
                          <span className="font-medium">Logout</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Login Button - Only show on landing page when not logged in */}
            {isLandingPage && !user && (
              <Link
                to="/login"
                className="bg-gradient font-medium text-white px-6 py-3 rounded-xl text-center shadow-sm hover:shadow-purple-500/25 transform hover:scale-105"
              >
                Login
              </Link>
            )}

            {/* Mobile Menu Button with rotation animation */}
            {isDashboard && (
              <button
                className="mobile-menu-button md:hidden text-white hover:text-purple-400 transition-all duration-200 hover:scale-110"
                onClick={handleMobileMenuToggle}
              >
                <div className="relative w-6 h-6">
                  <Menu
                    className={`absolute w-6 h-6 transition-all duration-300 ${
                      isMenuOpen
                        ? "rotate-180 opacity-0"
                        : "rotate-0 opacity-100"
                    }`}
                  />
                  <X
                    className={`absolute w-6 h-6 transition-all duration-300 ${
                      isMenuOpen
                        ? "rotate-0 opacity-100"
                        : "rotate-180 opacity-0"
                    }`}
                  />
                </div>
              </button>
            )}
          </div>
        </nav>
      </div>

      {/* Enhanced Mobile Menu with slide animation */}
      <div
        className={`mobile-menu fixed top-20 left-0 right-0 md:hidden bg-gradient-to-br from-gray-900/95 to-gray-800/95 backdrop-blur-md border border-purple-500/30 mx-5 rounded-xl shadow-2xl shadow-purple-500/20 z-60 transition-all duration-300 ease-out ${
          isMenuOpen
            ? "opacity-100 visible transform translate-y-0 scale-100"
            : "opacity-0 invisible transform -translate-y-4 scale-95"
        }`}
      >
        <div className="px-6 py-6 space-y-5">
          {/* Mobile Search with staggered animation */}
          {isDashboard && setSearchTerm && (
            <div
              className={`space-y-3 transition-all duration-300 delay-100 ${
                isMenuOpen
                  ? "opacity-100 transform translate-y-0"
                  : "opacity-0 transform translate-y-2"
              }`}
            >
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-purple-400 w-4 h-4" />
                <input
                  type="text"
                  value={searchTerm || ""}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyDown={handleSearch}
                  placeholder="Search movies..."
                  className="w-full pl-10 pr-10 py-3 bg-gray-800/70 border border-purple-500/30 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-400 transition-all duration-200 shadow-inner"
                />
                <button
                  className={`absolute right-3 top-1/2 transform -translate-y-1/2 cursor-pointer transition-all duration-200 ${
                    activeFilters
                      ? "text-purple-300 hover:text-purple-200 scale-110"
                      : "text-purple-400 hover:text-purple-300 hover:scale-110"
                  }`}
                  onClick={handleFilterToggle}
                  title="Filter movies"
                >
                  {activeFilters ? (
                    <FilterX className="w-4 h-4" />
                  ) : (
                    <FilterIcon className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Mobile Navigation Links with staggered animation */}
          {isDashboard && (
            <div
              className={`space-y-3 transition-all duration-300 delay-200 ${
                isMenuOpen
                  ? "opacity-100 transform translate-y-0"
                  : "opacity-0 transform translate-y-2"
              }`}
            >
              <div className="text-xs font-semibold text-purple-300 uppercase tracking-wider mb-3">
                Quick Links
              </div>
              <Link
                to="/watchlist"
                className="flex items-center space-x-3 text-white hover:text-purple-300 transition-all duration-200 py-3 px-4 rounded-lg hover:bg-gray-800/50 border border-transparent hover:border-purple-500/20 group transform hover:translate-x-1"
                onClick={() => setIsMenuOpen(false)}
              >
                <Bookmark className="w-5 h-5 group-hover:scale-110 transition-transform" />
                <span className="font-medium">Watchlist</span>
              </Link>
              <Link
                to="/favourite"
                className="flex items-center space-x-3 text-white hover:text-purple-300 transition-all duration-200 py-3 px-4 rounded-lg hover:bg-gray-800/50 border border-transparent hover:border-purple-500/20 group transform hover:translate-x-1"
                onClick={() => setIsMenuOpen(false)}
              >
                <Heart className="w-5 h-5 group-hover:scale-110 transition-transform" />
                <span className="font-medium">Favorites</span>
              </Link>
            </div>
          )}

          {/* Mobile User Menu with staggered animation */}
          {user && (
            <div
              className={`border-t border-gray-700/50 pt-5 space-y-3 transition-all duration-300 delay-300 ${
                isMenuOpen
                  ? "opacity-100 transform translate-y-0"
                  : "opacity-0 transform translate-y-2"
              }`}
            >
              <div className="text-xs font-semibold text-purple-300 uppercase tracking-wider mb-3">
                Account
              </div>
              <Link
                to="/profile"
                className="flex items-center space-x-3 text-white hover:text-purple-300 transition-all duration-200 py-3 px-4 rounded-lg hover:bg-gray-800/50 border border-transparent hover:border-purple-500/20 group transform hover:translate-x-1"
                onClick={() => setIsMenuOpen(false)}
              >
                <User className="w-5 h-5 group-hover:scale-110 transition-transform" />
                <span className="font-medium">Profile</span>
              </Link>
              <Link
                to="/settings"
                className="flex items-center space-x-3 text-white hover:text-purple-300 transition-all duration-200 py-3 px-4 rounded-lg hover:bg-gray-800/50 border border-transparent hover:border-purple-500/20 group transform hover:translate-x-1"
                onClick={() => setIsMenuOpen(false)}
              >
                <Settings className="w-5 h-5 group-hover:scale-110 transition-transform" />
                <span className="font-medium">Settings</span>
              </Link>
              <button
                onClick={() => {
                  setIsMenuOpen(false);
                  onLogout();
                }}
                className="flex items-center space-x-3 text-white hover:text-red-400 transition-all duration-200 py-3 px-4 rounded-lg hover:bg-red-900/20 border border-transparent hover:border-red-500/20 w-full text-left group transform hover:translate-x-1"
              >
                <LogOut className="w-5 h-5 group-hover:scale-110 transition-transform" />
                <span className="font-medium">Logout</span>
              </button>
            </div>
          )}

          {/* Mobile Login Button with staggered animation */}
          {(isLandingPage && !user ) && (
            <div
              className={`pt-4 border-t border-gray-700/50 transition-all duration-300 delay-400 ${
                isMenuOpen
                  ? "opacity-100 transform translate-y-0"
                  : "opacity-0 transform translate-y-2"
              }`}
            >
              <Link
                to="/login"
                className="block bg-gradient text-white font-medium px-6 py-3 rounded-xl text-center  shadow-sm hover:shadow-purple-500/25 transform hover:scale-105"
                onClick={() => setIsMenuOpen(false)}
              >
                Login
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Filter Component */}
      {isDashboard && user && (
        <MovieFilters
          onFiltersChange={handleFiltersChange}
          isLoading={loading}
          showFilterModal={isFilterModalOpen}
          onClose={handleFilterClose}
        />
      )}
    </div>
  );
};

export default Navbar;
