"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import LoginForm from "@/components/login/login-form";
import RegistrationForm from "@/components/registration/registration-form";
// Types Import
import { RegisterTabKey } from "@/lib/types";
import { TabKey } from "@/lib/types";

export default function Home() {
  const [tab, setTab] = useState<TabKey>("login");
  const [registerTab, setRegisterTab] = useState<RegisterTabKey>("student");

  const [open, setOpen] = useState(false);
  const [value, setValue] = useState("");

  return (
    <div
      className={
        tab === "register" ? "flex flex-col p-6" : "h-screen flex flex-col "
      }
    >
      <div
        className={`h-full grid ${
          tab === "register" ? "grid-cols-1" : "grid-cols-1 md:grid-cols-2"
        } justify-center items-center`}
      >
        {tab === "register" ? (
          ""
        ) : (
          <div className="flex flex-1 mt-15 flex-col md:justify-center md:items-center gap-2">
            <div className="p-10 text-center mx-5 md:mx-0">
              <h1 className="text-4xl md:text-6xl font-semibold mb-1 md:mb-4">
                Gatherly
              </h1>
              <p className="text-sm md:text-lg">
                Where Campus Life Comes Together
              </p>
            </div>
          </div>
        )}

        <div className="flex flex-1 justify-center items-center md:cols-span-2 ">
          <Card
            className={
              tab === "login"
                ? "w-full max-w-md mx-5 md:mx-0"
                : "w-full max-w-2xl"
            }
          >
            <Tabs
              value={tab}
              onValueChange={(v) => setTab(v as TabKey)}
              className="w-full my-2"
            >
              <CardHeader>
                <CardTitle className="text-center text-lg">
                  {tab === "login" ? "Welcome back" : "Create your account"}
                </CardTitle>
                <CardDescription className="text-center">
                  {tab === "login"
                    ? "Login with your Google Account"
                    : "Sign up using your Google Account"}
                </CardDescription>
                {tab === "login" ? (
                  <Button
                    disabled
                    variant="outline"
                    className="w-full cursor-pointer"
                  >
                    Login with Google
                  </Button>
                ) : (
                  <Button
                    disabled
                    variant="outline"
                    className="w-full cursor-pointer"
                  >
                    Signup with Google
                  </Button>
                )}

                <div className="my-4 after:border-border relative text-center text-sm after:absolute after:inset-0 after:top-1/2 after:z-0 after:flex after:items-center after:border-t">
                  <span className="bg-card text-muted-foreground relative z-10 px-2">
                    Or continue with
                  </span>
                </div>
                <TabsList className="w-full mb-2">
                  <TabsTrigger className="cursor-pointer" value="login">
                    Login
                  </TabsTrigger>
                  <TabsTrigger className="cursor-pointer" value="register">
                    Register
                  </TabsTrigger>
                </TabsList>
              </CardHeader>
              {/* LOGIN TAB */}
              <LoginForm />
              {/* REGISTER TAB */}
              <RegistrationForm
                registerTab={registerTab}
                setRegisterTab={setRegisterTab}
                value={value}
                setValue={setValue}
                open={open}
                setOpen={setOpen}
              />
            </Tabs>
          </Card>
        </div>
      </div>
    </div>
  );
}
