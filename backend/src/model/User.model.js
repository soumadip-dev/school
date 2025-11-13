import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    surname: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      sparse: true,
      lowercase: true,
      trim: true,
    },
    mobile: {
      type: String,
      trim: true,
    },
    profilepic: {
      type: String,
      default: '',
    },
    password: {
      type: String,
      required: true,
      minlength: 6,
    },

    // Password reset fields
    resetPasswordOtp: {
      type: String,
    },
    resetPasswordOtpExpiry: {
      type: Date,
    },

    // Reference fields
    presentcity: {
      type: String,
    },
    Matriculationbatch: {
      type: Number,
    },
    Intermediatebatch: {
      type: Number,
    },
    presentOrganization: {
      type: String,
    },
    joiningyear: {
      type: Number,
    },
  },
  { timestamps: true }
);

//* Pre save hook to hash the password and convert email to lowercase
userSchema.pre('save', async function (next) {
  if (this.isModified('password')) {
    this.password = await bcrypt.hash(this.password, 10);
  }
  this.email = this.email.toLowerCase();
  next();
});

export default mongoose.models.User || mongoose.model('User', userSchema);
