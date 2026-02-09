import type { SettingsModalProps } from "@/types";
import { ProfileSection } from "../form/ProfileSection";
import { EmailSection } from "../form/EmailSection";
import { PasswordSection } from "../form/PasswordSection";
import { TokensSection } from "../form/TokensSection";

export function SettingsModal({ userName, userEmail, onClose }: SettingsModalProps) {
  return (
    <div className="fb-modal-overlay" onClick={onClose}>
      <div
        className="fb-modal"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: 960, width: "100%" }}
      >
        <div className="fb-modal-header">
          <h3>Settings</h3>
          <button className="fb-modal-close" onClick={onClose}>
            &times;
          </button>
        </div>
        <div
          className="fb-modal-body"
          style={{
            padding: 24,
            gap: 24,
            alignItems: "start",
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
          }}
        >
          <div
            style={{ display: "flex", flexDirection: "column", gap: 24 }}
          >
            <ProfileSection currentName={userName} />
            <EmailSection currentEmail={userEmail} />
            <PasswordSection />
          </div>
          <TokensSection />
        </div>
      </div>
    </div>
  );
}
