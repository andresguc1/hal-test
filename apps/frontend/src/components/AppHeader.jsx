// eslint-disable-next-line no-unused-vars
import { motion } from "motion/react";
import "./styles/AppHeader.css";
import UserMenu from "./UserMenu";
import { ModeToggle } from "./mode-toggle";

export default function AppHeader({ onOpenSettings }) {
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
        className="app-title font-bold text-hal-neutral-950"
      >
        HAL-TEST
      </motion.h1>
      <div className="header-actions">
        <ModeToggle />
        <UserMenu onOpenSettings={onOpenSettings} />
      </div>
    </motion.header>
  );
}
