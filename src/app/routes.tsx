import { Navigate } from "react-router-dom";
import type { RouteObject } from "react-router-dom";
import { LessonsPage } from "../features/lessons/LessonsPage";
import { ProgressPage } from "../features/progress/ProgressPage";
import { SettingsPage } from "../features/settings/SettingsPage";
import { TypingPage } from "../features/typing/TypingPage";

export const routes: RouteObject[] = [
  { path: "/", element: <LessonsPage /> },
  { path: "/type", element: <TypingPage /> },
  { path: "/type/:lessonId", element: <TypingPage /> },
  { path: "/progress", element: <ProgressPage /> },
  { path: "/settings", element: <SettingsPage /> },
  { path: "*", element: <Navigate to="/" replace /> },
];
