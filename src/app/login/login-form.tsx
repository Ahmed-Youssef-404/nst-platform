// src/app/login/login-form.tsx
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LoginFormFields } from "@/components/login-form-fields";

export function LoginForm() {
    return (
        <Card className="w-full max-w-sm">
            <CardHeader>
                <CardTitle>Log in to NST Platform</CardTitle>
            </CardHeader>
            <CardContent>
                <LoginFormFields />
            </CardContent>
        </Card>
    );
}