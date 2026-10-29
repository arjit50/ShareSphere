const jwt = require('jsonwebtoken');
const User = require('../models/User');
const ApiResponse = require('../utils/apiResponse');
const { JWT_SECRET, JWT_EXPIRE, JWT_COOKIE_EXPIRE, NODE_ENV } = require('../config/env');

const signToken = (id) => {
  return jwt.sign({ id }, JWT_SECRET, { expiresIn: JWT_EXPIRE });
};

/**
 * Helper to generate JWT and send it inside an HTTP-only secure cookie
 */
const sendTokenCookieResponse = (res, statusCode, user, message) => {
  const token = signToken(user._id);
  const cookieDays = Number(JWT_COOKIE_EXPIRE) || 7;

  const cookieOptions = {
    expires: new Date(Date.now() + cookieDays * 24 * 60 * 60 * 1000),
    httpOnly: true,
    secure: NODE_ENV === 'production',
    sameSite: NODE_ENV === 'production' ? 'none' : 'lax',
    path: '/',
  };

  res.cookie('token', token, cookieOptions);

  return ApiResponse.success(
    res,
    {
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        avatar: user.avatar,
        address: user.address,
        role: user.role || 'user',
        createdAt: user.createdAt,
      },
    },
    message,
    statusCode
  );
};

// @desc    Register a new user & set JWT cookie
// @route   POST /api/v1/auth/register
// @access  Public
const register = async (req, res, next) => {
  try {
    const { name, email, password, phone, address, avatar } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return ApiResponse.error(res, 'Email address is already registered', 400);
    }

    const defaultAvatar =
      avatar ||
      `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=10b981&color=fff&size=128`;

    const user = await User.create({
      name,
      email,
      passwordHash: password,
      phone: phone || '',
      avatar: defaultAvatar,
      address: address || { city: 'Greenwood', area: 'Downtown' },
      role: 'user',
    });

    return sendTokenCookieResponse(res, 201, user, 'User registered successfully');
  } catch (error) {
    next(error);
  }
};

// @desc    Login user & set JWT cookie
// @route   POST /api/v1/auth/login
// @access  Public
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email }).select('+passwordHash');
    if (!user) {
      return ApiResponse.error(res, 'Invalid credentials', 401);
    }

    if (!user.isActive) {
      return ApiResponse.error(res, 'Account is deactivated. Please contact support.', 403);
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return ApiResponse.error(res, 'Invalid credentials', 401);
    }

    return sendTokenCookieResponse(res, 200, user, 'Logged in successfully');
  } catch (error) {
    next(error);
  }
};

// @desc    Logout user & clear JWT cookie
// @route   POST /api/v1/auth/logout
// @access  Public
const logout = async (req, res, next) => {
  try {
    const clearOptions = {
      httpOnly: true,
      secure: NODE_ENV === 'production',
      sameSite: NODE_ENV === 'production' ? 'none' : 'lax',
      path: '/',
    };

    res.clearCookie('token', clearOptions);
    res.cookie('token', '', { ...clearOptions, expires: new Date(0) });

    return ApiResponse.success(res, null, 'Logged out successfully');
  } catch (error) {
    next(error);
  }
};

// @desc    Get currently logged in user profile
// @route   GET /api/v1/auth/me
// @access  Private
const getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    return ApiResponse.success(res, user, 'Profile retrieved successfully');
  } catch (error) {
    next(error);
  }
};

// @desc    Update user profile
// @route   PUT /api/v1/auth/profile
// @access  Private
const updateProfile = async (req, res, next) => {
  try {
    const { name, phone, address, avatar } = req.body;

    const updates = {};
    if (name) updates.name = name;
    if (phone !== undefined) updates.phone = phone;
    if (address) updates.address = address;
    if (avatar) updates.avatar = avatar;

    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      { $set: updates },
      { new: true, runValidators: true }
    );

    return ApiResponse.success(res, updatedUser, 'Profile updated successfully');
  } catch (error) {
    next(error);
  }
};

// @desc    Change password
// @route   PUT /api/v1/auth/change-password
// @access  Private
const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;

    const user = await User.findById(req.user._id).select('+passwordHash');
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return ApiResponse.error(res, 'Current password does not match', 400);
    }

    user.passwordHash = newPassword;
    await user.save();

    return ApiResponse.success(res, null, 'Password updated successfully');
  } catch (error) {
    next(error);
  }
};

module.exports = {
  register,
  login,
  logout,
  getMe,
  updateProfile,
  changePassword,
};
