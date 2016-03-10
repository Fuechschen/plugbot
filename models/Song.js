module.exports = function (sequelize, Sequelize) {
    return sequelize.define('Song', {
        id: {type: Sequelize.INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true, unique: true},
        author: {type: Sequelize.STRING, allowNull: true},
        title: {type: Sequelize.STRING, allowNull: true},
        slug: {type: Sequelize.STRING, allowNull: true},
        format: {type: Sequelize.INTEGER.UNSIGNED, allowNull: false},
        cid: {type: Sequelize.STRING(20), allowNull: false, unique: true},
        plug_id: {type: Sequelize.INTEGER.UNSIGNED, unique: true},
        duration: {type: Sequelize.INTEGER.UNSIGNED},
        image: {type: Sequelize.STRING},
        isBanned: {type: Sequelize.BOOLEAN, defaultValue: false},
        ban_reason: {type: Sequelize.TEXT},
        tskip: {type: Sequelize.INTEGER.UNSIGNED, allowNull: true, defaultValue: null}
    }, {
        underscored: true,
        tableName: 'songs',
        setterMethods: {
            title: function (v) {
                var formattedSlug = S(this.getDataValue('author') + '-' + v).slugify().s;
                this.setDataValue('slug', formattedSlug);
                return this.setDataValue('title', v);
            },
            slug: function (v) {
                return this.setDataValue('slug', S(v).slugify().s);
            }
        }
    });
};