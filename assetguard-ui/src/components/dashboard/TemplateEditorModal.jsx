import { useRef } from "react";

function TemplateEditorModal({
  open,
  onClose,
  thresholdPercent,
  recipients,
  alertsEnabled,
  onThresholdChange,
  onRecipientsChange,
  onToggleAlerts,
  onSavePreferences,
  isSavingPreferences,
  disableSavePreferences,
  subject,
  body,
  bodyHtml,
  onSubjectChange,
  onBodyChange,
  onBodyHtmlChange,
  onSaveTemplate,
  onSendTestEmail,
  isSavingTemplate,
  disableSaveTemplate,
  isSendingTestEmail,
}) {

  const editorRef = useRef(null);

  const applyFormat = (command) => {
    document.execCommand(command, false);
    if (editorRef.current) onBodyHtmlChange(editorRef.current.innerHTML);
  };

  const insertVariable = (variable) => {
    if (!editorRef.current) return;
    editorRef.current.focus();
    document.execCommand("insertText", false, variable);
    onBodyHtmlChange(editorRef.current.innerHTML);
  };

  if (!open) {
    return null;
  }

  return (
    <div className="template-modal-backdrop" role="dialog" aria-modal="true">
      <div className="template-modal-card">
        <div className="template-modal-header">
          <h2>Template Editor</h2>
          <button type="button" className="section-action" onClick={onClose}>
            CLOSE
          </button>
        </div>

        <div className="template-modal-grid">
          <section className="alerts-card">
            <h3 className="template-modal-title">Email Preferences</h3>
            <div className="alerts-field-grid">
              <label className="alerts-field">
                <span className="alerts-label">THRESHOLD (%)</span>
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={thresholdPercent}
                  onChange={(event) => onThresholdChange(event.target.value)}
                />
              </label>

              <label className="alerts-field alerts-field-wide">
                <span className="alerts-label">RECIPIENTS</span>
                <input
                  type="text"
                  value={recipients}
                  onChange={(event) => onRecipientsChange(event.target.value)}
                />
              </label>
            </div>

            <div className="alerts-toggle-row">
              <p className="alerts-label">EMAIL ALERTS</p>
              <button
                type="button"
                className={`alerts-toggle ${alertsEnabled ? "active" : ""}`}
                onClick={onToggleAlerts}
              >
                {alertsEnabled ? "ON" : "OFF"}
              </button>
            </div>

            <div className="alerts-actions">
              <button
                type="button"
                className="new-evaluation-btn"
                onClick={onSavePreferences}
                disabled={isSavingPreferences || disableSavePreferences}
              >
                {isSavingPreferences ? "SAVING..." : "SAVE PREFERENCES"}
              </button>
            </div>
          </section>

          <section className="alerts-card">
            <h3 className="template-modal-title">Email Template</h3>
            <label className="alerts-field">
              <span className="alerts-label">SUBJECT</span>
              <input
                type="text"
                value={subject}
                onChange={(event) => onSubjectChange(event.target.value)}
              />
            </label>
            <label className="alerts-field">
              <span className="alerts-label">BODY (TEXT)</span>
              <textarea
                rows="6"
                value={body}
                onChange={(event) => onBodyChange(event.target.value)}
              />
            </label>

            <div className="alerts-field">
              <span className="alerts-label">BODY (RICH HTML)</span>
              <div style={{ display: "flex", gap: "8px", marginBottom: "8px", flexWrap: "wrap" }}>
                <button type="button" className="section-action" onClick={() => applyFormat("bold")}>B</button>
                <button type="button" className="section-action" onClick={() => applyFormat("italic")}>I</button>
                <button type="button" className="section-action" onClick={() => applyFormat("insertUnorderedList")}>• List</button>
                <button type="button" className="section-action" onClick={() => insertVariable("{assetName}")}>{"{assetName}"}</button>
                <button type="button" className="section-action" onClick={() => insertVariable("{status}")}>{"{status}"}</button>
                <button type="button" className="section-action" onClick={() => insertVariable("{overloadPercent}")}>{"{overloadPercent}"}</button>
              </div>
              <div
                ref={editorRef}
                contentEditable
                suppressContentEditableWarning
                style={{ minHeight: "160px", border: "1px solid #c8c8c8", borderRadius: "8px", padding: "10px", background: "#fff" }}
                dangerouslySetInnerHTML={{ __html: bodyHtml || "" }}
                onInput={(event) => onBodyHtmlChange(event.currentTarget.innerHTML)}
              />
            </div>

            <div className="alerts-field">
              <span className="alerts-label">PREVIEW</span>
              <div style={{ minHeight: "120px", border: "1px solid #e0e0e0", borderRadius: "8px", padding: "10px", background: "#fafafa" }} dangerouslySetInnerHTML={{ __html: bodyHtml || "" }} />
            </div>

            <div className="alerts-actions">
              <button
                type="button"
                className="new-evaluation-btn"
                onClick={onSaveTemplate}
                disabled={isSavingTemplate || disableSaveTemplate}
              >
                {isSavingTemplate ? "SAVING..." : "SAVE TEMPLATE"}
              </button>
              <button
                type="button"
                className="new-evaluation-btn"
                onClick={onSendTestEmail}
                disabled={isSendingTestEmail}
              >
                {isSendingTestEmail ? "SENDING..." : "SEND TEST EMAIL"}
              </button>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

export default TemplateEditorModal;
