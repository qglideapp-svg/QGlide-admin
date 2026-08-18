import React, { useState, useEffect, useCallback, useMemo } from 'react';
import './AddUserModal.css';
import './PartnerCodesModal.css';
import { useLanguage } from '../../contexts/LanguageContext';
import {
  fetchPartnerCodes,
  generatePartnerCode,
  defaultValidUntilIso,
  toValidUntilIso,
  toDateInputValue,
} from '../../services/partnerCodeService';

export default function PartnerCodesModal({ isOpen, onClose, partner, onGenerated }) {
  const { t, formatDate } = useLanguage();
  const [codes, setCodes] = useState([]);
  const [isLoadingCodes, setIsLoadingCodes] = useState(false);
  const [codesLoadError, setCodesLoadError] = useState(null);
  const [codeType, setCodeType] = useState('primary');
  const [parentCodeId, setParentCodeId] = useState('');
  const [branchId, setBranchId] = useState('');
  const [label, setLabel] = useState('');
  const [validUntil, setValidUntil] = useState(() => toDateInputValue(defaultValidUntilIso()));
  const [activate, setActivate] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  const [generatedCodeValue, setGeneratedCodeValue] = useState(null);

  const primaryCodes = useMemo(
    () => codes.filter((code) => code.codeType === 'primary'),
    [codes]
  );

  const hasPrimaryCode = primaryCodes.length > 0;

  const loadCodes = useCallback(async () => {
    if (!partner?.id) return;
    setIsLoadingCodes(true);
    setCodesLoadError(null);

    const result = await fetchPartnerCodes(partner.id);
    if (result.success) {
      setCodes(result.data?.codes ?? []);
    } else {
      setCodes([]);
      setCodesLoadError(result.error || t('partners.codesLoadError'));
    }
    setIsLoadingCodes(false);
  }, [partner?.id, t]);

  useEffect(() => {
    if (!isOpen || !partner) return;

    setCodeType('primary');
    setParentCodeId('');
    setBranchId('');
    setLabel('');
    setValidUntil(toDateInputValue(defaultValidUntilIso()));
    setActivate(true);
    setErrors({});
    setGeneratedCodeValue(null);
    loadCodes();
  }, [isOpen, partner, loadCodes]);

  useEffect(() => {
    if (primaryCodes.length === 1 && !parentCodeId) {
      setParentCodeId(primaryCodes[0].id);
    }
  }, [primaryCodes, parentCodeId]);

  const validateForm = () => {
    const nextErrors = {};

    if (!validUntil) {
      nextErrors.validUntil = t('partners.codesValidationValidUntil');
    }

    if (codeType === 'sub_code') {
      if (!hasPrimaryCode) {
        nextErrors.codeType = t('partners.codesNeedPrimaryFirst');
      }
      if (!parentCodeId) {
        nextErrors.parentCodeId = t('partners.codesValidationParent');
      }
      if (!label.trim()) {
        nextErrors.label = t('partners.codesValidationLabel');
      }
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleGenerate = async (e) => {
    e.preventDefault();
    if (!partner?.id || isSubmitting) return;
    if (!validateForm()) return;

    setIsSubmitting(true);
    setGeneratedCodeValue(null);

    const result = await generatePartnerCode({
      partnerId: partner.id,
      codeType,
      parentCodeId: codeType === 'sub_code' ? parentCodeId : undefined,
      branchId: codeType === 'sub_code' ? branchId : undefined,
      label: codeType === 'sub_code' ? label.trim() : undefined,
      validUntil: toValidUntilIso(validUntil),
      activate,
    });

    setIsSubmitting(false);

    if (!result.success) {
      setErrors({ submit: result.error || t('partners.codesGenerateError') });
      return;
    }

    const codeValue =
      result.data?.code ??
      result.data?.partner_code ??
      result.data?.alphanumeric_code ??
      '';

    setGeneratedCodeValue(codeValue || null);
    setErrors({});

    await loadCodes();
    if (onGenerated) onGenerated(result.data);
  };

  const handleClose = () => {
    if (isSubmitting) return;
    onClose();
  };

  if (!isOpen || !partner) return null;

  const partnerLabel =
    partner.displayName && partner.displayName !== '—'
      ? partner.displayName
      : partner.legalName || partner.id;

  return (
    <div className="modal-overlay" role="presentation" onClick={isSubmitting ? undefined : handleClose}>
      <div
        className="modal-content partner-codes-modal-content"
        role="dialog"
        aria-labelledby="partner-codes-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <div>
            <h2 id="partner-codes-title">{t('partners.codesModalTitle')}</h2>
            <p className="partner-codes-subtitle">{partnerLabel}</p>
          </div>
          <button
            type="button"
            className="modal-close"
            onClick={handleClose}
            disabled={isSubmitting}
            aria-label={t('common.close')}
          >
            ×
          </button>
        </div>

        <div className="modal-body">
          <div className="partner-codes-list">
            {isLoadingCodes ? (
              <p className="partner-codes-list-empty">{t('partners.codesLoading')}</p>
            ) : codes.length === 0 ? (
              <p className="partner-codes-list-empty">
                {codesLoadError || t('partners.codesEmpty')}
              </p>
            ) : (
              codes.map((code) => (
                <div key={code.id} className="partner-code-card">
                  <div className="partner-code-card-main">
                    <span className={`partner-code-card-type ${code.codeType}`}>
                      {code.codeType === 'sub_code'
                        ? t('partners.codeTypeSub')
                        : t('partners.codeTypePrimary')}
                    </span>
                    <span className="partner-code-card-value">{code.code || '—'}</span>
                    <span className="partner-code-card-meta">
                      {code.label ? `${t('partners.codesLabel')}: ${code.label} · ` : ''}
                      {code.validUntil
                        ? `${t('partners.codesValidUntil')}: ${formatDate(code.validUntil)}`
                        : t('partners.codesNoExpiry')}
                    </span>
                  </div>
                  <div className="partner-code-card-actions">
                    <span className={`partner-code-active-pill ${code.isActive ? 'active' : 'inactive'}`}>
                      {code.isActive ? t('partners.codesActive') : t('partners.codesInactive')}
                    </span>
                    {code.qrCodeUrl ? (
                      <a
                        href={code.qrCodeUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="partners-btn partners-btn-edit"
                        style={{ padding: '6px 10px', fontSize: 12 }}
                      >
                        QR
                      </a>
                    ) : null}
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="partner-codes-generate">
            <h3>{t('partners.codesGenerateHeading')}</h3>

            <div className="partner-codes-type-tabs" role="tablist">
              <button
                type="button"
                role="tab"
                className={`partner-codes-type-tab ${codeType === 'primary' ? 'active' : ''}`}
                onClick={() => {
                  setCodeType('primary');
                  setErrors({});
                }}
              >
                {t('partners.codeTypePrimary')}
              </button>
              <button
                type="button"
                role="tab"
                className={`partner-codes-type-tab ${codeType === 'sub_code' ? 'active' : ''}`}
                onClick={() => {
                  setCodeType('sub_code');
                  setErrors({});
                }}
                disabled={!hasPrimaryCode}
                title={!hasPrimaryCode ? t('partners.codesNeedPrimaryFirst') : undefined}
              >
                {t('partners.codeTypeSub')}
              </button>
            </div>

            <form onSubmit={handleGenerate}>
              {codeType === 'sub_code' ? (
                <>
                  <div className="form-group">
                    <label htmlFor="partner_parent_code">{t('partners.codesParentCode')}</label>
                    <select
                      id="partner_parent_code"
                      value={parentCodeId}
                      onChange={(e) => setParentCodeId(e.target.value)}
                      className={errors.parentCodeId ? 'error' : ''}
                    >
                      <option value="">{t('partners.codesSelectParent')}</option>
                      {primaryCodes.map((code) => (
                        <option key={code.id} value={code.id}>
                          {code.code || code.id}
                        </option>
                      ))}
                    </select>
                    {errors.parentCodeId ? (
                      <span className="error-message">{errors.parentCodeId}</span>
                    ) : null}
                  </div>

                  <div className="form-group">
                    <label htmlFor="partner_code_label">{t('partners.codesLabelField')}</label>
                    <input
                      id="partner_code_label"
                      type="text"
                      value={label}
                      onChange={(e) => setLabel(e.target.value)}
                      placeholder={t('partners.codesLabelPlaceholder')}
                      className={errors.label ? 'error' : ''}
                    />
                    {errors.label ? <span className="error-message">{errors.label}</span> : null}
                  </div>

                  <div className="form-group">
                    <label htmlFor="partner_branch_id">
                      {t('partners.codesBranchId')}{' '}
                      <span className="optional">{t('partners.legalNameOptional')}</span>
                    </label>
                    <input
                      id="partner_branch_id"
                      type="text"
                      value={branchId}
                      onChange={(e) => setBranchId(e.target.value)}
                      placeholder={t('partners.codesBranchIdPlaceholder')}
                    />
                  </div>
                </>
              ) : null}

              <div className="form-group">
                <label htmlFor="partner_code_valid_until">{t('partners.codesValidUntilField')}</label>
                <input
                  id="partner_code_valid_until"
                  type="date"
                  value={validUntil}
                  onChange={(e) => setValidUntil(e.target.value)}
                  className={errors.validUntil ? 'error' : ''}
                />
                {errors.validUntil ? (
                  <span className="error-message">{errors.validUntil}</span>
                ) : null}
              </div>

              <div className="form-group partner-codes-checkbox-row">
                <input
                  id="partner_code_activate"
                  type="checkbox"
                  checked={activate}
                  onChange={(e) => setActivate(e.target.checked)}
                />
                <label htmlFor="partner_code_activate">{t('partners.codesActivate')}</label>
              </div>

              {errors.codeType ? <span className="error-message">{errors.codeType}</span> : null}
              {errors.submit ? <span className="error-message">{errors.submit}</span> : null}

              {generatedCodeValue ? (
                <div className="partner-codes-success">
                  <span>{t('partners.codesGeneratedLabel')}</span>
                  <strong>{generatedCodeValue}</strong>
                </div>
              ) : null}

              <div className="modal-footer" style={{ padding: '16px 0 0', marginTop: 16 }}>
                <button type="button" className="btn-cancel" onClick={handleClose} disabled={isSubmitting}>
                  {t('partners.cancel')}
                </button>
                <button type="submit" className="btn-create" disabled={isSubmitting}>
                  {isSubmitting ? t('partners.codesGenerating') : t('partners.codesGenerate')}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
