import Header from "./header";
import { Outlet } from "react-router-dom";

export default function Layout() {
  return (
    <>
      <Header />
      <main className="container-fluid mt-3">
        <Outlet />
      </main>
    </>
  );
}
