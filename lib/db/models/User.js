module.exports = (sequelize, Sequelize) => sequelize.define("User", {
    id: {type: Sequelize.INTEGER.UNSIGNED, primaryKey: true, unique: true},
    username: {type: Sequelize.STRING, allowNull: false},
    language: {type: Sequelize.STRING, defaultValue: 'en'},
    avatar_id: {type: Sequelize.STRING},
    badge: {type: Sequelize.STRING},
    blurb: {type: Sequelize.TEXT},
    global_role: {type: Sequelize.INTEGER.UNSIGNED, defaultValue: 0},
    role: {type: Sequelize.INTEGER.UNSIGNED, defaultValue: 0},
    super_user: {type: Sequelize.BOOLEAN, defaultValue: false},
    s_role: {type: Sequelize.INTEGER.UNSIGNED, defaultValue: 0},
    level: {type: Sequelize.INTEGER.UNSIGNED, defaultValue: 0},
    custom_points: {type: Sequelize.INTEGER.UNSIGNED, defaultValue: 0},
    joined: {type: Sequelize.DATE, defaultValue: Sequelize.NOW},
    birthday: {type: Sequelize.DATE},
    status: {type: Sequelize.BOOLEAN, defaultValue: true},
    afk_msg: {type: Sequelize.TEXT, allowNull: true},
    last_seen: {type: Sequelize.DATE, defaultValue: Sequelize.NOW},
    last_active: {type: Sequelize.DATE, defaultValue: Sequelize.NOW},
    afk_level: {type: Sequelize.ENUM('active', 'afk', 'warned', 'warned2'), defaultValue: 'active'},
    wl_removes: {type: Sequelize.INTEGER.UNSIGNED, defaultValue: 0}
}, {
    underscored: true,
    tableName: 'users'
});