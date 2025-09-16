import { useRef, useState } from "react";

type Props = {
  name?: string;
  onFile?(file: File | null): void;
  accept?: string;
  className?: string;
  buttonText?: string;
};

export default function StyledFileInput({
  name = "photo",
  onFile,
  accept = "image/*",
  className = "",
  buttonText = "Choose file",
}: Props) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [fileName, setFileName] = useState<string>("");

  const openPicker = () => inputRef.current?.click();

  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] ?? null;
    setFileName(f ? f.name : "");
    onFile?.(f);
  };

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <input
        ref={inputRef}
        type="file"
        name={name}
        accept={accept}
        className="hidden"
        onChange={onChange}
      />
      <button
        type="button"
        onClick={openPicker}
        className="inline-flex items-center rounded-2xl px-4 py-2 border border-emerald-400/40 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 shadow-sm transition"
      >
        {buttonText}
      </button>
      <span className="text-sm text-gray-600 truncate max-w-[16rem]">{fileName || "No file chosen"}</span>
    </div>
  );
}
