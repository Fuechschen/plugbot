module.exports = function (sequelize, Sequelize) {
    return sequelize.define('Song', {
        id: {type: Sequelize.INTEGER.UNSIGNED, autoIncrement: true, unique: true},
        name: {type: Sequelize.STRING, allowNull: true},
        cid: {type: Sequelize.STRING(161), allowNull: true, primaryKey: true, unique: true},
        is_banned: {type: Sequelize.BOOLEAN, defaultValue: false},
        ban_reason: {type: Sequelize.TEXT}
    }, {
        underscored: true,
        tableName: 'channels'
    });
};