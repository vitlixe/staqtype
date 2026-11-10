import { useRoutes } from "react-router-dom";
import { Header } from "../components/Header";
import { routes } from "./routes";

export function App() {
  const element = useRoutes(routes);
  return (
    <div className="mx-auto flex min-h-screen w-full max-w-[940px] flex-col px-4 pt-6 pb-5">
      <Header />
      <main className="flex min-w-0 flex-1 flex-col py-10">{element}</main>
    </div>
  );
}
