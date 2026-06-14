"use client";

import { useActionState, useEffect, useRef, useTransition } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/cn";

type AdminFormAction = (formData: FormData) => void | Promise<void>;

type SubmittedValues = Record<string, string | string[]>;

type AdminActionState = {
    status: "idle" | "success" | "error";
    message: string;
    submittedAt: number;
    values: SubmittedValues;
};

type AdminActionFormProps = Omit<React.FormHTMLAttributes<HTMLFormElement>, "action"> & {
    action: AdminFormAction;
    successMessage?: string;
};

const INITIAL_STATE: AdminActionState = {
    status: "idle",
    message: "",
    submittedAt: 0,
    values: {},
};

function errorMessage(error: unknown) {
    if (error instanceof Error) return error.message;

    return "Something went wrong while saving.";
}

function getSubmittedValues(formData: FormData) {
    const values: SubmittedValues = {};

    formData.forEach((value, key) => {
        if (value instanceof File) return;

        const current = values[key];

        if (Array.isArray(current)) {
            current.push(value);
            return;
        }

        if (typeof current === "string") {
            values[key] = [current, value];
            return;
        }

        values[key] = value;
    });

    return values;
}

function submittedValueList(values: SubmittedValues, name: string) {
    const value = values[name];

    if (Array.isArray(value)) return value;
    if (typeof value === "string") return [value];

    return [];
}

function submittedFirstValue(values: SubmittedValues, name: string) {
    return submittedValueList(values, name)[0] ?? "";
}

function syncFormDefaults(form: HTMLFormElement, values: SubmittedValues) {
    const fields = Array.from(
        form.querySelectorAll<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>(
            "input, select, textarea",
        ),
    );

    fields.forEach((field) => {
        if (!field.name) return;

        if (field instanceof HTMLInputElement) {
            if (field.type === "file") return;

            if (field.type === "checkbox" || field.type === "radio") {
                const submittedValues = submittedValueList(values, field.name);
                const checked = submittedValues.includes(field.value);

                field.defaultChecked = checked;
                field.checked = checked;

                return;
            }

            const nextValue = submittedFirstValue(values, field.name);

            field.defaultValue = nextValue;
            field.value = nextValue;

            return;
        }

        if (field instanceof HTMLSelectElement) {
            const submittedValues = submittedValueList(values, field.name);

            Array.from(field.options).forEach((option) => {
                const selected = submittedValues.includes(option.value);

                option.defaultSelected = selected;
                option.selected = selected;
            });

            return;
        }

        const nextValue = submittedFirstValue(values, field.name);

        field.defaultValue = nextValue;
        field.value = nextValue;
    });
}

export function AdminActionForm({
    action,
    children,
    className,
    successMessage = "Saved successfully. You can continue editing.",
    ...props
}: AdminActionFormProps) {
    const router = useRouter();
    const formRef = useRef<HTMLFormElement>(null);
    const [, startTransition] = useTransition();

    const [state, formAction, pending] = useActionState<AdminActionState, FormData>(
        async (_previousState, formData) => {
            const values = getSubmittedValues(formData);

            try {
                await action(formData);

                return {
                    status: "success",
                    message: successMessage,
                    submittedAt: Date.now(),
                    values,
                };
            } catch (error) {
                return {
                    status: "error",
                    message: errorMessage(error),
                    submittedAt: Date.now(),
                    values,
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

        if (state.status === "success") {
            syncFormDefaults(form, state.values);

            startTransition(() => {
                router.refresh();
            });
        }

        form.dispatchEvent(
            new CustomEvent("admin-action-state-change", {
                bubbles: true,
                detail: state,
            }),
        );
    }, [router, state, startTransition]);

    return (
        <form ref={formRef} action={formAction} className={cn(className)} {...props}>
            <input type="hidden" name="keep_modal_open" value="1" />

            {children}

            {state.status === "success" ? (
                <div
                    role="status"
                    className="rounded-2xl border border-emerald-400/20 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-100"
                >
                    {state.message}
                </div>
            ) : null}

            {state.status === "error" ? (
                <div
                    role="alert"
                    className="rounded-2xl border border-red-400/20 bg-red-500/10 px-4 py-3 text-sm text-red-100"
                >
                    {state.message}
                </div>
            ) : null}
        </form>
    );
}