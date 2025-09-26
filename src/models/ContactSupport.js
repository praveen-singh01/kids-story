const mongoose = require('mongoose');

const contactSupportSchema = new mongoose.Schema({
  whatsapp: {
    type: String,
    required: [true, 'WhatsApp number is required'],
    validate: {
      validator: function(v) {
        // Validate phone number format (10-15 digits)
        return /^[0-9]{10,15}$/.test(v);
      },
      message: 'WhatsApp number must be 10-15 digits'
    }
  },
  phone: {
    type: String,
    required: [true, 'Phone number is required'],
    validate: {
      validator: function(v) {
        // Validate phone number format (10-15 digits)
        return /^[0-9]{10,15}$/.test(v);
      },
      message: 'Phone number must be 10-15 digits'
    }
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    lowercase: true,
    trim: true,
    validate: {
      validator: function(v) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
      },
      message: 'Please enter a valid email address'
    }
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true,
  toJSON: {
    transform: function(doc, ret) {
      ret.id = ret._id;
      delete ret._id;
      delete ret.__v;
      return ret;
    }
  }
});

// Virtual for WhatsApp URL
contactSupportSchema.virtual('whatsappUrl').get(function() {
  return `https://wa.me/91${this.whatsapp}`;
});

// Static method to get or create default contact support
contactSupportSchema.statics.getOrCreateDefault = async function(createdBy) {
  let contactSupport = await this.findOne({ isActive: true });
  
  if (!contactSupport) {
    // Create default contact support
    contactSupport = await this.create({
      whatsapp: '9670796114',
      phone: '9670796114',
      email: 'support@gumbotech.in',
      createdBy,
      isActive: true
    });
  }
  
  return contactSupport;
};

// Instance method to format for API response
contactSupportSchema.methods.toApiResponse = function() {
  return {
    Whatsapp: this.whatsappUrl,
    Call: this.phone,
    Email: this.email
  };
};

module.exports = mongoose.model('ContactSupport', contactSupportSchema);
