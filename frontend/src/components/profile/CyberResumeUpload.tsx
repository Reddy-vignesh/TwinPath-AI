import React, { useState, useRef } from 'react';
import { UploadCloud, FileText, Sparkles, Loader2, Cpu } from 'lucide-react';

interface CyberResumeUploadProps {
  onFileSelect: (file: File) => void;
  uploading: boolean;
  disabled?: boolean;
}

export const CyberResumeUpload: React.FC<CyberResumeUploadProps> = ({
  onFileSelect,
  uploading,
  disabled = false
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled && !uploading) setIsDragOver(true);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled && !uploading) setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    if (disabled || uploading) return;

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      onFileSelect(files[0]);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onFileSelect(file);
    }
    e.target.value = '';
  };

  const handleClick = () => {
    if (!disabled && !uploading && fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  return (
    <div 
      className={`cyber-upload-card ${isHovered ? 'is-hovered' : ''} ${isDragOver ? 'drag-active' : ''} ${uploading ? 'uploading-state' : ''}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onDragEnter={handleDragEnter}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={handleClick}
      role="button"
      tabIndex={0}
      aria-label="Upload Resume PDF for AI Vector Calibration"
    >
      <input 
        ref={fileInputRef}
        type="file" 
        accept=".pdf" 
        disabled={disabled || uploading} 
        onChange={handleInputChange} 
        className="cyber-hidden-input" 
      />

      {/* Cyber Ambient Laser Scan Sweep */}
      <div className="cyber-laser-sweep" />

      {/* Top Hologram Badge */}
      <div className="cyber-badge-header">
        <span className="cyber-badge">
          <Cpu size={12} color="#38BDF8" />
          <span>AI EVIDENCE INGESTION ENGINE</span>
        </span>
        <span className="cyber-format-pill">PDF ONLY</span>
      </div>

      <div className="cyber-upload-inner">
        {/* Holographic Cyber Folder & Floating Documents */}
        <div className="cyber-folder-system">
          {/* Backplate of the Glass Vault */}
          <div className="cyber-folder-back">
            <div className="cyber-folder-tab" />
          </div>

          {/* Floating Holographic Papers with Circuit/Neural Vectors */}
          <div className="cyber-papers">
            {/* Paper 1: Code & Skills Matrix */}
            <div className="cyber-paper file-left">
              <div className="cyber-code-line line-cyan" />
              <div className="cyber-code-line line-short" />
              <div className="cyber-code-line line-purple" />
              <div className="cyber-code-line line-micro" />
              <div className="cyber-code-line line-cyan" />
            </div>

            {/* Paper 2: Trajectory & Salary Radar */}
            <div className="cyber-paper file-right">
              <div className="cyber-paper-chip">
                <FileText size={13} color="#38BDF8" />
                <span className="chip-text">RESUME.PDF</span>
              </div>
              <div className="cyber-code-line line-purple" />
              <div className="cyber-code-line line-cyan" />
              <div className="cyber-code-line line-short" />
            </div>
          </div>

          {/* Front Glass Flap with Hologram Lock / Sensor */}
          <div className="cyber-folder-front">
            <div className="cyber-front-scanner">
              <div className="scanner-light" />
            </div>
          </div>

          {/* Floating Cyber Hologram Sparkles & Data Dots */}
          <div className="cyber-decor sparkle-top">
            <Sparkles size={16} color="#38BDF8" />
          </div>
          <div className="cyber-decor sparkle-bottom">
            <Sparkles size={14} color="#818CF8" />
          </div>
        </div>

        {/* Content & Call to Action */}
        <div className="cyber-upload-content">
          {uploading ? (
            <div className="cyber-loading-cluster">
              <Loader2 size={24} className="spin" color="#38BDF8" />
              <div className="cyber-upload-title active-pulse">
                Parsing Neural Vectors & Skills...
              </div>
              <div className="cyber-upload-subtext">
                Extracting GitHub, LinkedIn, academic scores & calibrating 216-D twin weights
              </div>
            </div>
          ) : (
            <>
              <div className="cyber-upload-title">
                Automated Resume Parser & Evidence Extractor
              </div>
              <div className="cyber-upload-subtext">
                Drag & drop your PDF resume here, or click anywhere to browse
              </div>

              <div className="cyber-cta-row">
                <span className="btn btn-primary cyber-upload-btn">
                  <UploadCloud size={16} />
                  <span>Choose PDF Resume</span>
                </span>
                <span className="cyber-sub-hint">
                  Auto-fills verified links, university, CGPA & technical skills
                </span>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
