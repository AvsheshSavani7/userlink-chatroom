import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAppDispatch } from "../store/hooks";
import { createUser } from "../store/userSlice";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import { toast } from "sonner";
import { createUserWithAssistant } from "../services/assistantService";

const UserNameForm = () => {
  const [name, setName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Please enter your name");
      return;
    }

    setIsLoading(true);

    try {
      // Create user in the database with an OpenAI assistant
      const user = await createUserWithAssistant(name.trim());

      // Update Redux store with user data
      dispatch(
        createUser({
          id: user.id,
          name: user.name
        })
      );

      toast.success(`Welcome, ${name}! Your personal AI assistant is ready.`);
      navigate(`/chat/${user.id}`);
    } catch (error) {
      console.error("Error creating tenant:", error);
      toast.error("Failed to create your account. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md glass-effect animate-scale-in">
      <CardHeader>
        <CardTitle className="text-2xl font-medium text-center">
          Create Your Account
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Input
              id="name"
              type="text"
              placeholder="Enter your name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="h-12 px-4 rounded-xl"
              autoFocus
            />
          </div>
          <CardFooter className="px-0 pt-4">
            <Button
              type="submit"
              className="w-full h-12 text-base font-medium rounded-xl transition-all duration-300 bg-brand hover:bg-brand-dark"
              disabled={isLoading}
            >
              {isLoading ? (
                <div className="typing-indicator">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
              ) : (
                "Start Asking"
              )}
            </Button>
          </CardFooter>
        </form>
      </CardContent>
    </Card>
  );
};

export default UserNameForm;
