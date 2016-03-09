module.exports = {
    replace: function (str, replacer) {
        var keys = _.keys(replacer);
        var string = S(str);
        keys.forEach(function (key) {
            string = string.replaceAll('&{' + key + '}', replacer[key] || '');
        });
        return string.s;
    },
    songtitle: function (author, title) {
        return author + ' - ' + title;
    },
    role: function (role) {
        var r;
        switch (role) {
            case 'none':
                r = plugged.USERROLE.NONE;
                break;
            case 'rdj':
                r = plugged.USERROLE.RESIDENTDJ;
                break;
            case 'bouncer':
                r = plugged.USERROLE.BOUNCER;
                break;
            case 'manager':
                r = plugged.USERROLE.MANAGER;
                break;
            case 'co-host':
                r = plugged.USERROLE.COHOST;
                break;
            case 'host':
                r = plugged.USERROLE.HOST;
                break;
            case 0:
                r = plugged.USERROLE.NONE;
                break;
            case 1:
                r = plugged.USERROLE.RESIDENTDJ;
                break;
            case 2:
                r = plugged.USERROLE.BOUNCER;
                break;
            case 3:
                r = plugged.USERROLE.MANAGER;
                break;
            case 4:
                r = plugged.USERROLE.COHOST;
                break;
            case 5:
                r = plugged.USERROLE.HOST;
                break;
            default:
                r = plugged.USERROLE.NONE;
                break;
        }
        return r;
    },
    permlevel: function (role) {
        var r;
        switch (role) {
            case plugged.USERROLE.NONE:
                r = 0;
                break;
            case plugged.USERROLE.RESIDENTDJ:
                r = 1;
                break;
            case plugged.USERROLE.BOUNCER:
                r = 2;
                break;
            case plugged.USERROLE.MANAGER:
                r = 3;
                break;
            case plugged.USERROLE.COHOST:
                r = 4;
                break;
            case plugged.USERROLE.HOST:
                r = 5;
                break;
            default:
                r = undefined;
                break;
        }
        return r;
    },
    rolename: function (role) {
        var r;
        switch (role) {
            case plugged.USERROLE.NONE:
                r = langfile.setstaff.roles.user;
                break;
            case plugged.USERROLE.RESIDENTDJ:
                r = langfile.setstaff.roles.rdj;
                break;
            case plugged.USERROLE.BOUNCER:
                r = langfile.setstaff.roles.bouncer;
                break;
            case plugged.USERROLE.MANAGER:
                r = plugged.setstaff.roles.manager;
                break;
            case plugged.USERROLE.COHOST:
                r = plugged.setstaff.roles.cohost;
                break;
            case plugged.USERROLE.HOST:
                r = plugged.setstaff.roles.host;
                break;
            default:
                r = plugged.setstaff.roles.undef;
                break;
        }
        return r;
    },
    blacklistReason: function (str) {
        var string = S(str);
        var keys = _.keys(langfile.blacklist.reasons);
        keys.forEach(function (key) {
            string = string.replaceAll('#' + key, langfile.blacklist.reasons[key]);
        });
        return string;
    }
};