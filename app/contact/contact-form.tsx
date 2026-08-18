"use client";

import { type FormEvent, useId, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { MaterialIcon } from "@/components/ui/material-icon";
import styles from "./page.module.css";

type FieldName = "name" | "company" | "message" | "email";
type TouchedFields = Partial<Record<FieldName, boolean>>;
type SubmitStatus = "idle" | "submitting" | "success" | "error";
type ContactResponse = {
  ok?: boolean;
  message?: string;
};

const initialValues: Record<FieldName, string> = {
  name: "",
  company: "",
  message: "",
  email: "",
};

function validateField(name: FieldName, value: string | undefined) {
  const trimmedValue = value?.trim() ?? "";

  if (!trimmedValue) return "This field is required.";

  if (
    name === "email" &&
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedValue)
  ) {
    return "Please enter a valid email address.";
  }

  return "";
}

export function ContactForm() {
  const formId = useId();
  const searchParams = useSearchParams();
  const [values, setValues] = useState(initialValues);
  const [touched, setTouched] = useState<TouchedFields>({});
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<SubmitStatus>("idle");

  const errors = useMemo(
    () => ({
      name: validateField("name", values.name),
      company: validateField("company", values.company),
      message: validateField("message", values.message),
      email: validateField("email", values.email),
    }),
    [values],
  );

  const hasErrors = Object.values(errors).some(Boolean);
  const sourceContext = useMemo(() => {
    const source = searchParams.get("source");
    if (source === "role-fit-report-cta" || source === "portfolio-cta") return source;
    return "direct-contact-page";
  }, [searchParams]);
  const reportId = useMemo(() => {
    const value = searchParams.get("report_id")?.trim().toUpperCase() ?? "";
    return /^[A-Z0-9]{1,5}$/.test(value) ? value : "";
  }, [searchParams]);

  function getFieldState(name: FieldName) {
    const shouldValidate = touched[name] || submitAttempted;

    if (!shouldValidate) return "";

    return errors[name] ? styles.invalidField : styles.validField;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitAttempted(true);
    setTouched({
      name: true,
      company: true,
      message: true,
      email: true,
    });

    if (hasErrors || submitStatus === "submitting") return;

    setSubmitStatus("submitting");

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: values.name,
          company: values.company,
          message: values.message,
          email: values.email,
          source_context: sourceContext,
          report_id: sourceContext === "role-fit-report-cta" ? reportId : "",
        }),
      });

      const result = (await response.json().catch(() => ({}))) as ContactResponse;

      if (!response.ok || !result.ok) {
        setSubmitStatus("error");
        return;
      }

      setSubmitStatus("success");
      setValues(initialValues);
      setTouched({});
      setSubmitAttempted(false);
    } catch {
      setSubmitStatus("error");
    }
  }

  function updateValue(name: FieldName, value: string) {
    setValues((current) => ({
      ...current,
      [name]: value,
    }));
  }

  return (
    <form className={styles.form} noValidate onSubmit={handleSubmit}>
      <p className={styles.sentence}>
        Hi Shani, my name is{" "}
        <span
          className={`${styles.inlineField} ${getFieldState("name")}`}
        >
          <label className={styles.srOnly} htmlFor={`${formId}-name`}>
            Your name
          </label>

          <input
            id={`${formId}-name`}
            name="name"
            type="text"
            placeholder="Your name"
            autoComplete="name"
            value={values.name}
            aria-invalid={Boolean(
              (touched.name || submitAttempted) && errors.name,
            )}
            aria-describedby={`${formId}-name-message`}
            onBlur={() =>
              setTouched((current) => ({
                ...current,
                name: true,
              }))
            }
            onChange={(event) => updateValue("name", event.target.value)}
            required
          />

          <span
            className={styles.fieldMessage}
            id={`${formId}-name-message`}
          >
            {(touched.name || submitAttempted) && errors.name
              ? errors.name
              : "Who should I reply to?"}
          </span>
        </span>{" "}
        and I&apos;m reaching out from{" "}
        <span
          className={`${styles.inlineField} ${getFieldState("company")}`}
        >
          <label className={styles.srOnly} htmlFor={`${formId}-company`}>
            Company or team
          </label>

          <input
            id={`${formId}-company`}
            name="company"
            type="text"
            placeholder="Company / team"
            autoComplete="organization"
            value={values.company}
            aria-invalid={Boolean(
              (touched.company || submitAttempted) && errors.company,
            )}
            aria-describedby={`${formId}-company-message`}
            onBlur={() =>
              setTouched((current) => ({
                ...current,
                company: true,
              }))
            }
            onChange={(event) =>
              updateValue("company", event.target.value)
            }
            required
          />

          <span
            className={styles.fieldMessage}
            id={`${formId}-company-message`}
          >
            {(touched.company || submitAttempted) && errors.company
              ? errors.company
              : "Company, team, or project"}
          </span>
        </span>{" "}
        about{" "}
        <span
          className={`${styles.inlineField} ${styles.longField} ${getFieldState(
            "message",
          )}`}
        >
          <label className={styles.srOnly} htmlFor={`${formId}-message`}>
            Role, project, or collaboration
          </label>

          <input
            id={`${formId}-message`}
            name="message"
            type="text"
            placeholder="role, project, or collaboration"
            autoComplete="off"
            value={values.message}
            aria-invalid={Boolean(
              (touched.message || submitAttempted) && errors.message,
            )}
            aria-describedby={`${formId}-message-message`}
            onBlur={() =>
              setTouched((current) => ({
                ...current,
                message: true,
              }))
            }
            onChange={(event) =>
              updateValue("message", event.target.value)
            }
            required
          />

          <span
            className={styles.fieldMessage}
            id={`${formId}-message-message`}
          >
            {(touched.message || submitAttempted) && errors.message
              ? errors.message
              : "Short context is enough"}
          </span>
        </span>
        . You can contact me at{" "}
        <span
          className={`${styles.inlineField} ${styles.longField} ${getFieldState(
            "email",
          )}`}
        >
          <label className={styles.srOnly} htmlFor={`${formId}-email`}>
            Email address
          </label>

          <input
            id={`${formId}-email`}
            name="email"
            type="email"
            placeholder="name@email.com"
            autoComplete="email"
            value={values.email}
            aria-invalid={Boolean(
              (touched.email || submitAttempted) && errors.email,
            )}
            aria-describedby={`${formId}-email-message`}
            onBlur={() =>
              setTouched((current) => ({
                ...current,
                email: true,
              }))
            }
            onChange={(event) => updateValue("email", event.target.value)}
            required
          />

          <span
            className={styles.fieldMessage}
            id={`${formId}-email-message`}
          >
            {(touched.email || submitAttempted) && errors.email
              ? errors.email
              : "Best email for follow-up"}
          </span>
        </span>
        .
      </p>

      <div className={styles.actions}>
        <Button
          type="submit"
          variant="primary"
          tone="outlined"
          disabled={(hasErrors && submitAttempted) || submitStatus === "submitting"}
        >
          {submitStatus === "submitting" ? "Sending..." : <><MaterialIcon name="send" />Send Details</>}
        </Button>
      </div>

      {submitStatus === "success" ? (
        <p className={`${styles.statusMessage} ${styles.successMessage}`} role="status">
          Thanks - your message was sent.
        </p>
      ) : null}

      {submitStatus === "error" ? (
        <p className={styles.statusMessage} role="alert">
          I couldn&apos;t send the message right now. Please try again.
        </p>
      ) : null}
    </form>
  );
}
