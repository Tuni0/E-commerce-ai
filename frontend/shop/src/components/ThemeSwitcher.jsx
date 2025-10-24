import { useTheme } from "./../ThemeContext.jsx";
import { BsFillMoonStarsFill, BsSunFill } from "react-icons/bs";
import { motion } from "framer-motion";

const ThemeSwitcher = () => {
  const { theme, toggleTheme } = useTheme();

  return (
    <motion.button
      onClick={toggleTheme}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.9 }}
      transition={{ type: "spring", stiffness: 400, damping: 10 }}
      className="rounded p-2 text-gray-700 dark:text-black"
    >
      {theme === "light" ? (
        <BsFillMoonStarsFill className="size-6" />
      ) : (
        <BsSunFill className="size-6 text-yellow-300" />
      )}
    </motion.button>
  );
};

export default ThemeSwitcher;
