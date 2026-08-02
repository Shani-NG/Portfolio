"use client";

import { type FormEvent, useId, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import styles from "./page.module.css";

type FieldName = "name" | "email" | "message";
type TouchedFields = Partial<Record<FieldName, boolean>>;

const initialValues: Record<FieldName, string> = {
  name: "",
  email: "",
  message: "",
};

function validateField(name: FieldName, value: string) {
  const trimmedValue = value.trim();

  if (!trimmedValue) return "This field is required.";
  if (name === "email" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedValue)) {
    return "Please enter a valid email address.";
  }

  return "";
}

export function ContactForm() {
  const formId = useId();
  const [values, setValues] = useState(initialValues);
  const [touched, setTouched] = useState<TouchedFields>({});
  const [submitAttempted, setSubmitAttempted] = useState(false);

  const errors = useMemo(
    () => ({
      name: validateField("name", values.name),
      email: validateField("email", values.email),
      message: validateField("message", values.message),
    }),
    [values],
  );

  const hasErrors = Object.values(errors).some(Boolean);

  function getFieldState(name: FieldName) {
    const shouldValidate = touched[name] || submitAttempted;
    if (!shouldValidate) return "";
    return errors[name] ? styles.invalidField : styles.validField;
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitAttempted(true);
    setTouched({ name: true, email: true, message: true });
  }

  return (
    <form className={styles.form} noValidate onSubmit={handleSubmit}>
      <div className={`${styles.field} ${getFieldState("name")}`}>
        <label htmlFor={`${formId}-name`}>Name</label>
        <input
          id={`${formId}-name`}
          name="name"
          type="text"
          autoComplete="name"
          value={values.name}
          aria-invalid={Boolean((touched.name || submitAttempted) && errors.name)}
          aria-describedby={`${formId}-name-message`}
          onBlur={() => setTouched((current) => ({ ...current, name: true }))}
          onChange={(event) => setValues((current) => ({ ...current, name: event.target.value }))}
          required
        />
        <p className={styles.fieldMessage} id={`${formId}-name-message`}>
          {(touched.name || submitAttempted) && errors.name ? errors.name : "Who should I reply to?"}
        </p>
      </div>

      <div className={`${styles.field} ${getFieldState("email")}`}>
        <label htmlFor={`${formId}-email`}>Email</label>
        <input
          id={`${formId}-email`}
          name="email"
          type="email"
          autoComplete="email"
          value={values.email}
          aria-invalid={Boolean((touched.email || submitAttempted) && errors.email)}
          aria-describedby={`${formId}-email-message`}
          onBlur={() => setTouched((current) => ({ ...current, email: true }))}
          onChange={(event) => setValues((current) => ({ ...current, email: event.target.value }))}
          required
        />
        <p className={styles.fieldMessage} id={`${formId}-email-message`}>
          {(touched.email || submitAttempted) && errors.email ? errors.email : "Best email for follow-up."}
        </p>
      </div>

      <div className={`${styles.field} ${getFieldState("message")}`}>
        <label htmlFor={`${formId}-message`}>Message</label>
        <textarea
          id={`${formId}-message`}
          name="message"
          autoComplete="off"
          rows={4}
          value={values.message}
          aria-invalid={Boolean((touched.message || submitAttempted) && errors.message)}
          aria-describedby={`${formId}-message-message`}
          onBlur={() => setTouched((current) => ({ ...current, message: true }))}
          onChange={(event) => setValues((current) => ({ ...current, message: event.target.value }))}
          required
        />
        <p className={styles.fieldMessage} id={`${formId}-message-message`}>
          {(touched.message || submitAttempted) && errors.message ? errors.message : "A short context is enough."}
        </p>
      </div>

      <div className={styles.actions}>
        <Button type="submit" variant="primary" tone="outlined" disabled={hasErrors && submitAttempted}>
          Send
        </Button>
      </div>

      {submitAttempted && !hasErrors ? (
        <p className={styles.statusMessage} role="alert">
          The contact form UI is ready, but the project does not currently include a Contact submission handler.
        </p>
      ) : null}
    </form>
  );
}
