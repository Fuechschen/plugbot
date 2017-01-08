module.exports = (sequelize, Sequelize) => sequelize.define("User", {
    id: {type: Sequelize.INTEGER.UNSIGNED, primaryKey: true, unique: true},
    username: {type: Sequelize.STRING, allowNull: false},
    language: {type: Sequelize.STRING, defaultValue: 'en'},
    avatarId: {type: Sequelize.STRING, field: 'avatar_id'},
    badge: {type: Sequelize.STRING},
    blurb: {type: Sequelize.TEXT},
    globalRole: {type: Sequelize.INTEGER.UNSIGNED, defaultValue: 0, field:'global_role'},
    role: {type: Sequelize.INTEGER.UNSIGNED, defaultValue: 0},
    superUser: {type: Sequelize.BOOLEAN, defaultValue: false},
    sRole: {type: Sequelize.INTEGER.UNSIGNED, defaultValue: 0, field: 's_role'},
    level: {type: Sequelize.INTEGER.UNSIGNED, defaultValue: 0},
    customPoints: {type: Sequelize.INTEGER.UNSIGNED, defaultValue: 0, field: 'custom_points'},
    joined: {type: Sequelize.DATE, defaultValue: Sequelize.NOW},
    birthday: {type: Sequelize.DATE},
    status: {type: Sequelize.BOOLEAN, defaultValue: true},
    afkMsg: {type: Sequelize.TEXT, allowNull: true, field: 'afk_msg'},
    lastSeen: {type: Sequelize.DATE, defaultValue: Sequelize.NOW, field: 'last_seen'},
    lastActive: {type: Sequelize.DATE, defaultValue: Sequelize.NOW, field: 'last_active'},
    afkLevel: {type: Sequelize.ENUM('active', 'afk', 'warned', 'warned2'), defaultValue: 'active', field: 'afk_level'},
    wlRemoves: {type: Sequelize.INTEGER.UNSIGNED, defaultValue: 0, field: 'wl_removes'}
}, {
    underscored: true,
    tableName: 'users'
});