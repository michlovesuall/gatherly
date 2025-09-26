"use client";
import { Button } from "../button";

export default function Navbar() {
  return (
    <div className="bg-blue-950 flex justify-between align-middle p-4">
      <h1 className="ml-10 text-2xl text-white font-bold">Gatherly</h1>
      <Button className="cursor-pointer mr-10">Sign Up</Button>
    </div>
  );
}
