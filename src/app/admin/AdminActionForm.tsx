"use client";

import { useActionState, useEffect, useRef } from "react";
import { cn } from "@/lib/cn";

type AdminFormAction = (formData: FormData) => void | Promise<void>;

type AdminActionState = {
    status: "idle" | "success" | "error";
    message: string;
    submittedAt: number;
};

type AdminActionFormProps = Omit<React.FormHTMLAttributes<HTMLFormElement>, "action"> & {
    action: AdminFormAction;
    successMessage?: string;
};

const INITIAL_STATE: AdminActionState = {
    status: "idle",
    message: "",
    submittedAt: 0,
};

function errorMessage(error: unknown) {
    if (error instanceof Error) return error.message;

    return "Something went wrong while saving.";
}

export function AdminActionForm({
    action,
    children,
    className,
    successMessage = "Saved successfully. You can continue editing.",
    ...props
}: AdminActionFormProps) {
    const formRef = useRef<HTMLFormElement>(null);

    const [state, formAction, pending] = useActionState<AdminActionState, FormData>(
        async (_previousState, formData) => {
            try {
                await action(formData);

                return {
                    status: "success",
                    message: successMessage,
                    submittedAt: Date.now(),
                };
            } catch (error) {
                return {
                    status: "error",
                    message: errorMessage(error),
                    submittedAt: Date.now(),
                };
            }
        },
        INITIAL_STATE,
    );

    useEffect(() => {
        const form = formRef.current;
        if (!form) return;

        form.dispatchEvent(
            new CustomEvent("admin-action-pending-change", {
                bubbles: true,
                detail: { pending },
            }),
        );
    }, [pending]);

    useEffect(() => {
        const form = formRef.current;
        if (!form || state.status === "idle") return;

        form.dispatchEvent(
            new CustomEvent("admin-action-state-change", {
                bubbles: true,
                detail: state,
            }),
        );
    }, [state]);

    return (
        <form ref={formRef} action={formAction} className={cn(className)} {...props}>
            <input type="hidden" name="keep_modal_open" value="1" />

            {children}

            {state.status === "success" ? (
                <div
                    role="status"
                    className="rounded-2xl border mt-3 border-emerald-400/20 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-100"
                >
                    {state.message}
                </div>
            ) : null}

            {state.status === "error" ? (
                <div
                    role="alert"
                    className="rounded-2xl border mt-3 border-red-400/20 bg-red-500/10 px-4 py-3 text-sm text-red-100"
                >
                    {state.message}
                </div>
            ) : null}
        </form>
    );
}