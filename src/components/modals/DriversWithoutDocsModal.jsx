import React, { useEffect, useMemo, useState } from 'react';
import './DriversWithoutDocsModal.css';
import { useLanguage } from '../../contexts/LanguageContext';
import UserAvatar from '../common/UserAvatar';

const DriversWithoutDocsModal = ({
  isOpen,
  onClose,
  drivers = [],
  totalCount = 0,
  summaryMessage = '',
  isLoading = false,
  isSending = false,
  onSendReminders,
  sendResult = null,
}) => {
  const { t } = useLanguage();
  const [subject, setSubject] = useState('');
  const [bodyText, setBodyText] = useState('');
  const eligibleCount = totalCount > 0 ? totalCount : drivers.length;

  const defaultSubject = useMemo(
    () => t('dashboard.documentReminderDefaultSubject'),
    [t]
  );

  const defaultBodyText = useMemo(
    () => t('dashboard.documentReminderDefaultMessage'),
    [t]
  );

  useEffect(() => {
    if (isOpen) {
      setSubject('');
      setBodyText('');
    }
  }, [isOpen]);

  const handleSendAll = () => {
    if (eligibleCount === 0 || isSending) return;
    onSendReminders({
      subject: subject.trim() || defaultSubject,
      bodyText: bodyText.trim() || defaultBodyText,
    });
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay drivers-without-docs-overlay" onClick={onClose}>
      <div
        className="modal-content drivers-without-docs-modal"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-labelledby="drivers-without-docs-title"
      >
        <div className="modal-header drivers-without-docs-header">
          <div className="drivers-without-docs-title-wrap">
            <span className="material-symbols-outlined drivers-without-docs-icon">warning</span>
            <div>
              <h2 id="drivers-without-docs-title">{t('dashboard.driversWithoutDocsTitle')}</h2>
              <p>{t('dashboard.driversWithoutDocsSubtitle')}</p>
            </div>
          </div>
          <button type="button" className="modal-close" onClick={onClose} aria-label={t('common.close')}>
            ×
          </button>
        </div>

        <div className="modal-body drivers-without-docs-body">
          {sendResult?.success ? (
            <div className="drivers-without-docs-success">
              <span className="material-symbols-outlined">mark_email_read</span>
              <div>
                <strong>{t('dashboard.documentReminderSentTitle')}</strong>
                <p>
                  {t('dashboard.documentReminderSentBody', {
                    count: sendResult.sentCount ?? 0,
                  })}
                </p>
              </div>
            </div>
          ) : (
            <>
              <div className="drivers-without-docs-summary">
                <span className="summary-count">{eligibleCount}</span>
                <span>{summaryMessage || t('dashboard.driversMissingDocuments')}</span>
              </div>

              <div className="drivers-without-docs-table-wrap">
                {isLoading ? (
                  <div className="drivers-without-docs-loading">
                    <div className="loading-spinner" />
                    <span>{t('dashboard.loadingDriversWithoutDocs')}</span>
                  </div>
                ) : drivers.length === 0 ? (
                  <div className="drivers-without-docs-empty">
                    <span className="material-symbols-outlined">
                      {eligibleCount > 0 ? 'info' : 'task_alt'}
                    </span>
                    <p>
                      {eligibleCount > 0
                        ? t('dashboard.driversMissingDocsPreviewUnavailable')
                        : t('dashboard.noDriversMissingDocs')}
                    </p>
                  </div>
                ) : (
                  <table className="drivers-without-docs-table">
                    <thead>
                      <tr>
                        <th>{t('drivers.driverName')}</th>
                        <th>{t('dashboard.contact')}</th>
                        <th>{t('dashboard.missingDocuments')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {drivers.map((driver) => (
                        <tr key={driver.id}>
                          <td>
                            <div className="driver-info-cell">
                              <UserAvatar
                                src={driver.avatar}
                                name={driver.name}
                                className="driver-avatar"
                              />
                              <div>
                                <div className="driver-name-text">{driver.name}</div>
                                {driver.registeredAt && (
                                  <div className="driver-meta">
                                    {new Date(driver.registeredAt).toLocaleDateString()}
                                  </div>
                                )}
                              </div>
                            </div>
                          </td>
                          <td>
                            <div className="contact-cell">
                              {driver.email ? (
                                <span className="contact-line">
                                  <span className="material-symbols-outlined">mail</span>
                                  {driver.email}
                                </span>
                              ) : null}
                              {driver.phone ? (
                                <span className="contact-line">
                                  <span className="material-symbols-outlined">call</span>
                                  {driver.phone}
                                </span>
                              ) : null}
                            </div>
                          </td>
                          <td>
                            <div className="missing-docs-tags">
                              {(driver.missingDocs?.length ? driver.missingDocs : [t('dashboard.documentsPending')]).map((doc) => (
                                <span key={`${driver.id}-${doc}`} className="missing-doc-tag">
                                  {doc}
                                </span>
                              ))}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>

              <div className="drivers-without-docs-email-form">
                <div className="drivers-without-docs-field">
                  <label htmlFor="document-reminder-subject">
                    {t('dashboard.documentReminderSubjectLabel')}
                  </label>
                  <input
                    id="document-reminder-subject"
                    type="text"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder={defaultSubject}
                    disabled={isSending || isLoading || eligibleCount === 0}
                  />
                </div>

                <div className="drivers-without-docs-field">
                  <label htmlFor="document-reminder-message">
                    {t('dashboard.documentReminderMessageLabel')}
                  </label>
                  <textarea
                    id="document-reminder-message"
                    value={bodyText}
                    onChange={(e) => setBodyText(e.target.value)}
                    placeholder={defaultBodyText}
                    rows={6}
                    disabled={isSending || isLoading || eligibleCount === 0}
                  />
                  <p className="message-hint">{t('dashboard.documentReminderMessageHint')}</p>
                </div>
              </div>
            </>
          )}
        </div>

        <div className="modal-footer drivers-without-docs-footer">
          {sendResult?.success ? (
            <button type="button" className="btn-save" onClick={onClose}>
              {t('common.close')}
            </button>
          ) : (
            <>
              <button type="button" className="btn-cancel" onClick={onClose} disabled={isSending}>
                {t('common.cancel')}
              </button>
              <button
                type="button"
                className="btn-save"
                onClick={handleSendAll}
                disabled={isSending || isLoading || eligibleCount === 0}
              >
                <span className="material-symbols-outlined">mail</span>
                {isSending
                  ? t('dashboard.sendingDocumentReminders')
                  : t('dashboard.sendReminderToAll', { count: eligibleCount })}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default DriversWithoutDocsModal;
