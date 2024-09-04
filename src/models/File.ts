import { Schema, model } from 'mongoose';

interface IFile {
  filename: string;
  path: string;
  type: string;
  size: number;
  passphraseCode?: string;
  alt?: string;
  description?: string;
  uploadedAt: Date;
}

const fileSchema = new Schema<IFile>({
  filename: { type: String, required: true },
  path: { type: String, required: true },
  type: { type: String, required: true },
  size: { type: Number, required: true },
  passphraseCode: { type: String },
  alt: { type: String },
  description: { type: String },
  uploadedAt: { type: Date, default: Date.now }
});

const File = model<IFile>('File', fileSchema);

export default File;
