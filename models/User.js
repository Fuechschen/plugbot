module.exports = function(sequelize, Sequelize) {
    return sequelize.define("user", {
        id: {type: Sequelize.INTEGER.UNSIGNED, primaryKey: true, unique: true},
        username: {type: Sequelize.STRING, allowNull: false},
        slug: {type: Sequelize.STRING, allowNull: false},
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
        last_seen: {type: Sequelize.DATE, defaultValue: Sequelize.NOW},
        last_active: {type: Sequelize.DATE, defaultValue: Sequelize.NOW}
    }, {
        underscored: true,
        tableName: 'users'
    })
};