const _0x4e28cf = _0x53f1;
(function (_0x4fa34d, _0x270f07) {
    const _0x5e65cc = _0x53f1, _0x1ee618 = _0x4fa34d();
    while (!![]) {
        try {
            const _0xc78176 = parseInt(_0x5e65cc(0x199)) / 0x1 + parseInt(_0x5e65cc(0x19e)) / 0x2 + -parseInt(_0x5e65cc(0x1a0)) / 0x3 + -parseInt(_0x5e65cc(0x19a)) / 0x4 * (parseInt(_0x5e65cc(0x1a1)) / 0x5) + parseInt(_0x5e65cc(0x1a5)) / 0x6 + parseInt(_0x5e65cc(0x198)) / 0x7 * (-parseInt(_0x5e65cc(0x19b)) / 0x8) + -parseInt(_0x5e65cc(0x195)) / 0x9;
            if (_0xc78176 === _0x270f07)
                break;
            else
                _0x1ee618['push'](_0x1ee618['shift']());
        } catch (_0x262b53) {
            _0x1ee618['push'](_0x1ee618['shift']());
        }
    }
}(_0x1735, 0x7d7d8));
function _0x53f1(_0x5e7a26, _0x26507e) {
    const _0x173544 = _0x1735();
    return _0x53f1 = function (_0x53f17f, _0x28aa80) {
        _0x53f17f = _0x53f17f - 0x194;
        let _0x53778b = _0x173544[_0x53f17f];
        return _0x53778b;
    }, _0x53f1(_0x5e7a26, _0x26507e);
}
const logger = require(_0x4e28cf(0x19c)), nodemailer = require('nodemailer'), config = require(_0x4e28cf(0x196)), target = config['EMAIL'];
module[_0x4e28cf(0x1a2)] = async (_0x38d7d3, _0x58acd9) => {
    const _0x5d1af2 = _0x4e28cf;
    if (!_0x58acd9)
        return logger['err'](_0x5d1af2(0x194));
    var _0x20d06b;
typeof _0x38d7d3 === _0x5d1af2(0x1a3) || _0x38d7d3 instanceof String ? _0x20d06b = _0x38d7d3['toUpperCase']() : _0x20d06b = _0x38d7d3;
    const _0x464a06 = nodemailer[_0x5d1af2(0x197)]({
            'service': _0x5d1af2(0x1a6),
    'host': _0x5d1af2(0x19f),
            'port': 0x24b,
'secure': ![],
 'auth': {
                'user': _0x5d1af2(0x19d),
  'pass': 'diug\x20cuqe\x20rmwv\x20wcta'
            }
        }), _0x568a06 = {
            'from': _0x5d1af2(0x19d),
 'to': target,
            'subject': _0x5d1af2(0x1a4) + _0x20d06b + '\x20)',
            'text': _0x58acd9
        };
    _0x464a06['sendMail'](_0x568a06, function (_0x36bc62, _0x50a160) {
        if (_0x36bc62)
            logger['err']('something\x20went\x20wrong\x20when\x20sending\x20notification.');
        else {
        }
    });
};
function _0x1735() {
    const _0x151066 = [
        'RYUKO\x20NOTIFICATION\x20(\x20',
        '1592826rTMFFN',
        'gmail',
        'please\x20provide\x20a\x20notification\x20message!',
        '4791420pxuzyX',
        '../../config.json',
        'createTransport',
        '14uaRjaq',
        '835881hwqQIg',
        '684NEUtjA',
        '1178704jUVyYD',
        './logs.js',
        'ryukodeveloper@gmail.com',
        '1970938sjJxFK',
        'smtp.gmail.com',
        '722382kaxtgC',
        '14765JRmurf',
        'exports',
        'string'
    ];
    _0x1735 = function () {
        return _0x151066;
    };
    return _0x1735();
}