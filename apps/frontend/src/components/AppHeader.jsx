import { motion } from "motion/react";
import "./styles/AppHeader.css";
import UserMenu from "./UserMenu";

export default function AppHeader() {
  return (
    <motion.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="header"
    >
      <motion.h1
        initial={{ x: -20, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.5 }}
        className="app-title"
      >
        HAL-TEST
      </motion.h1>
      <div className="header-actions">
        <UserMenu />
      </div>
    </motion.header>
  );
}
