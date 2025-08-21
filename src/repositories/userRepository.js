const { User } = require('../models');

class UserRepository {
  /**
   * Find user by email
   */
  async findByEmail(email) {
    return User.findOne({ email: email.toLowerCase() }).lean();
  }

  /**
   * Find user by email (with methods for authentication)
   */
  async findByEmailForAuth(email) {
    return User.findOne({ email: email.toLowerCase() });
  }

  /**
   * Find user by ID
   */
  async findById(id) {
    return User.findById(id).lean();
  }

  /**
   * Find user by Google ID
   */
  async findByGoogleId(googleId) {
    return User.findOne({ provider: 'google', googleId }).lean();
  }

  /**
   * Create new user
   */
  async create(userData) {
    const user = new User(userData);
    return user.save();
  }

  /**
   * Update user by ID
   */
  async updateById(id, updateData) {
    return User.findByIdAndUpdate(id, updateData, { new: true }).lean();
  }

  /**
   * Update user's last login time
   */
  async updateLastLogin(id) {
    return User.findByIdAndUpdate(
      id, 
      { lastLoginAt: new Date() }, 
      { new: true }
    ).lean();
  }

  /**
   * Update user's subscription
   */
  async updateSubscription(id, subscriptionData) {
    return User.findByIdAndUpdate(
      id,
      { 
        subscription: {
          ...subscriptionData,
          updatedAt: new Date(),
        }
      },
      { new: true }
    ).lean();
  }

  /**
   * Find or create user (upsert for Google auth)
   */
  async findOrCreate(googleData) {
    const { email, name, googleId } = googleData;
    
    // Try to find existing user by email first
    let user = await this.findByEmail(email);
    
    if (user) {
      // Update Google ID if not set
      if (!user.googleId) {
        user = await this.updateById(user._id, { googleId });
      }
      // Update last login
      user = await this.updateLastLogin(user._id);
    } else {
      // Create new user
      user = await this.create({
        email: email.toLowerCase(),
        name,
        provider: 'google',
        googleId,
        roles: ['user'],
        lastLoginAt: new Date(),
      });
    }
    
    return user;
  }

  /**
   * Get user with subscription details
   */
  async findWithSubscription(id) {
    return User.findById(id)
      .select('email name roles subscription lastLoginAt createdAt updatedAt')
      .lean();
  }

  /**
   * Find users by subscription status
   */
  async findBySubscriptionStatus(status) {
    return User.find({ 'subscription.status': status }).lean();
  }

  /**
   * Count total users
   */
  async count() {
    return User.countDocuments();
  }

  /**
   * Find users created in date range
   */
  async findByDateRange(startDate, endDate) {
    return User.find({
      createdAt: {
        $gte: startDate,
        $lte: endDate,
      }
    }).lean();
  }

  /**
   * Find user by email verification token
   */
  async findByEmailVerificationToken(token) {
    return User.findOne({ emailVerificationToken: token });
  }

  /**
   * Find user by password reset token
   */
  async findByPasswordResetToken(token) {
    return User.findOne({
      passwordResetToken: token,
      passwordResetExpires: { $gt: Date.now() }
    });
  }
}

module.exports = new UserRepository();
