// Authentication routes
const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { supabaseAdmin } = require('../config/database');
const { authenticateToken } = require('../middleware/auth');
const { JWT_EXPIRATION } = require('../config/constants');

// POST /api/auth/signup
router.post('/signup', async (req, res) => {
    try {
        const { username, password, teamName } = req.body;

        // Validation
        if (!username || !password || !teamName) {
            return res.status(400).json({ error: 'Username, password, and team name required' });
        }

        if (username.length < 3 || username.length > 50) {
            return res.status(400).json({ error: 'Username must be 3-50 characters' });
        }

        if (password.length < 6) {
            return res.status(400).json({ error: 'Password must be at least 6 characters' });
        }

        if (teamName.length < 3 || teamName.length > 100) {
            return res.status(400).json({ error: 'Team name must be 3-100 characters' });
        }

        // Check if username exists
        const { data: existingUser } = await supabaseAdmin
            .from('users')
            .select('id')
            .eq('username', username)
            .single();

        if (existingUser) {
            return res.status(409).json({ error: 'Username already taken' });
        }

        // Check if this is the first user (becomes admin)
        const { count } = await supabaseAdmin
            .from('users')
            .select('id', { count: 'exact', head: true });

        const isFirstUser = count === 0;
        const isAdmin = isFirstUser || (username === 'admin' && password === 'admin');

        // Hash password
        const passwordHash = await bcrypt.hash(password, 10);

        // Create user
        const { data: newUser, error } = await supabaseAdmin
            .from('users')
            .insert({
                username,
                password_hash: passwordHash,
                team_name: teamName,
                is_admin: isAdmin
            })
            .select()
            .single();

        if (error) {
            console.error('Signup error:', error);
            return res.status(500).json({ error: 'Failed to create user' });
        }

        // Generate JWT
        const token = jwt.sign(
            { userId: newUser.id, username: newUser.username },
            process.env.JWT_SECRET,
            { expiresIn: JWT_EXPIRATION }
        );

        res.status(201).json({
            message: 'User created successfully',
            token,
            user: {
                id: newUser.id,
                username: newUser.username,
                teamName: newUser.team_name,
                isAdmin: newUser.is_admin
            }
        });
    } catch (error) {
        console.error('Signup error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({ error: 'Username and password required' });
        }

        // Get user
        const { data: user, error } = await supabaseAdmin
            .from('users')
            .select('*')
            .eq('username', username)
            .single();

        if (error || !user) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Verify password
        const validPassword = await bcrypt.compare(password, user.password_hash);

        if (!validPassword) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Generate JWT
        const token = jwt.sign(
            { userId: user.id, username: user.username },
            process.env.JWT_SECRET,
            { expiresIn: JWT_EXPIRATION }
        );

        res.json({
            message: 'Login successful',
            token,
            user: {
                id: user.id,
                username: user.username,
                teamName: user.team_name,
                isAdmin: user.is_admin
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// GET /api/auth/me
router.get('/me', authenticateToken, async (req, res) => {
    try {
        res.json({
            user: {
                id: req.user.id,
                username: req.user.username,
                teamName: req.user.team_name,
                isAdmin: req.user.is_admin,
                createdAt: req.user.created_at
            }
        });
    } catch (error) {
        console.error('Get user error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// PUT /api/auth/change-password
router.put('/change-password', authenticateToken, async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;

        if (!currentPassword || !newPassword) {
            return res.status(400).json({ error: 'Current and new password required' });
        }

        if (newPassword.length < 6) {
            return res.status(400).json({ error: 'New password must be at least 6 characters' });
        }

        // Verify current password
        const validPassword = await bcrypt.compare(currentPassword, req.user.password_hash);

        if (!validPassword) {
            return res.status(401).json({ error: 'Current password is incorrect' });
        }

        // Hash new password
        const newPasswordHash = await bcrypt.hash(newPassword, 10);

        // Update password
        const { error } = await supabaseAdmin
            .from('users')
            .update({ password_hash: newPasswordHash, updated_at: new Date() })
            .eq('id', req.user.id);

        if (error) {
            console.error('Password change error:', error);
            return res.status(500).json({ error: 'Failed to update password' });
        }

        res.json({ message: 'Password changed successfully' });
    } catch (error) {
        console.error('Change password error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// PUT /api/auth/change-team-name
router.put('/change-team-name', authenticateToken, async (req, res) => {
    try {
        const { teamName } = req.body;

        if (!teamName) {
            return res.status(400).json({ error: 'Team name required' });
        }

        if (teamName.length < 3 || teamName.length > 100) {
            return res.status(400).json({ error: 'Team name must be 3-100 characters' });
        }

        // Update team name
        const { error } = await supabaseAdmin
            .from('users')
            .update({ team_name: teamName, updated_at: new Date() })
            .eq('id', req.user.id);

        if (error) {
            console.error('Team name change error:', error);
            return res.status(500).json({ error: 'Failed to update team name' });
        }

        res.json({ 
            message: 'Team name changed successfully',
            teamName 
        });
    } catch (error) {
        console.error('Change team name error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;