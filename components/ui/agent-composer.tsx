import { useRef, useState } from "react";
import type { ButtonHTMLAttributes, ReactNode } from "react";
import { Chip } from "@/components/ui/chip";
import { MaterialIcon } from "@/components/ui/material-icon";
import styles from "./agent-composer.module.css";

type ComposerState = "empty" | "focus" | "filled" | "loading" | "disabled";

type ComposerAction = {
  label: string;
  icon: string;
  action?: "upload" | "paste" | "insert";
  value?: string;
  disabled?: boolean;
};

type AgentComposerProps = {
  placeholder: string;
  value?: string;
  state?: ComposerState;
  actions?: ComposerAction[];
  statusText?: string;
  className?: string;
  onSubmit?: () => void;
};

function joinClasses(...classes: Array<string | false | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function ComposerButton({
  children,
  className,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { children: ReactNode }) {
  return (
    <button className={joinClasses(styles.iconButton, className)} type="button" {...props}>
      {children}
    </button>
  );
}

export function AgentComposer({
  placeholder,
  value = "",
  state = "empty",
  actions = [],
  statusText,
  className,
  onSubmit,
}: AgentComposerProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isDisabled = state === "disabled";
  const isLoading = state === "loading";
  const [inputValue, setInputValue] = useState(value);
  const [uploadedFileName, setUploadedFileName] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const hasValue = inputValue.trim().length > 0 || uploadedFileName.length > 0 || isLoading;
  const isHintOnly = !hasValue;
  const visualState = isDisabled ? "disabled" : isLoading ? "loading" : hasValue ? "filled" : isFocused ? "focus" : "empty";
  const uploadLabel = uploadedFileName ? `Attached file: ${uploadedFileName}` : "Upload job description";

  const handleUploadClick = () => {
    if (isDisabled) return;
    fileInputRef.current?.click();
  };

  const handleQuickAction = async (action: ComposerAction) => {
    if (isDisabled || action.disabled) return;

    if (action.action === "upload") {
      handleUploadClick();
      return;
    }

    if (action.action === "paste") {
      try {
        const clipboardText = await navigator.clipboard.readText();
        if (clipboardText.trim()) {
          setInputValue(clipboardText);
        }
      } catch {
        return;
      }
      return;
    }

    if (action.action === "insert") {
      setInputValue(action.value ?? action.label);
    }
  };

  return (
    <div className={joinClasses(styles.shell, styles[visualState], className)} data-has-value={hasValue}>
      <div className={styles.inputSurface} aria-disabled={isDisabled}>
        <div className={styles.promptText}>
          {uploadedFileName ? (
            <div className={styles.uploadedFileTag}>
              <MaterialIcon name="description" />
              <span>{uploadedFileName}</span>
              <button aria-label="Remove attached file" type="button" onClick={() => setUploadedFileName("")}>
                <MaterialIcon name="cancel" />
              </button>
            </div>
          ) : null}
          {isLoading ? (
            <span className={styles.loadingText}>
              <span className={styles.loadingDot} aria-hidden="true" />
              {statusText ?? "Loading job description..."}
            </span>
          ) : (
            <textarea
              className={hasValue ? styles.valueInput : styles.placeholderInput}
              aria-label="Ask about my experience"
              disabled={isDisabled}
              onBlur={() => setIsFocused(false)}
              onChange={(event) => setInputValue(event.target.value)}
              onFocus={() => setIsFocused(true)}
              placeholder={placeholder}
              value={inputValue}
            />
          )}
        </div>

        <div className={styles.inputControls}>
          <input
            aria-label={uploadLabel}
            className={styles.fileInput}
            disabled={isDisabled}
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) setUploadedFileName(file.name);
            }}
            ref={fileInputRef}
            type="file"
          />
          <ComposerButton aria-label="Add job description" disabled={isDisabled} onClick={handleUploadClick}>
            <MaterialIcon name="add" />
          </ComposerButton>
          <div className={styles.submitControls}>
            <ComposerButton aria-label="Voice input" disabled={isDisabled}>
              <MaterialIcon name="mic" />
            </ComposerButton>
            <ComposerButton className={styles.submitButton} aria-label="Generate role fit report" disabled={isDisabled || isHintOnly || isLoading} onClick={onSubmit}>
              <MaterialIcon name="arrow_forward" />
            </ComposerButton>
          </div>
        </div>
      </div>

      {actions.length > 0 ? (
        <div className={styles.quickActions} aria-label="Role Fit quick actions">
          {actions.map((action) => (
            <Chip className={styles.quickAction} disabled={isDisabled || action.disabled} icon={action.icon} key={action.label} kind="action" onClick={() => void handleQuickAction(action)} tone="primary">
              {action.label}
            </Chip>
          ))}
        </div>
      ) : null}
    </div>
  );
}
