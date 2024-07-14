$(document).ready(function () {
    var docEl = document.documentElement
    var dpr = window.devicePixelRatio || 1
    
    // adjust body font size
    function setBodyFontSize() {
        if (document.body) {
        document.body.style.fontSize = 12 * dpr + 'px'
        } else {
        document.addEventListener('DOMContentLoaded', setBodyFontSize)
        }
    }
    setBodyFontSize()
    
    // set 1rem = viewWidth / 10
    // pc端屏幕适配 一般将flexble分为24份
    // 默认情况下是将屏幕大小分为了100份
    // 原理 不管屏幕是多大 反正默认指定的分数
    function setRemUnit() {
        // 这里默认是10等份，手动改为24，此时1rem=1920/24px即80px。（设计稿是1920px的）
        var rem = docEl.clientWidth / 24
        docEl.style.fontSize = rem + 'px'
    }
    
    setRemUnit()
    
    // reset rem unit on page resize
    window.addEventListener('resize', setRemUnit)
    window.addEventListener('pageshow', function (e) {
        if (e.persisted) {
        setRemUnit()
        }
    })
    
    // detect 0.5px supports
    if (dpr >= 2) {
        var fakeBody = document.createElement('body')
        var testElement = document.createElement('div')
        testElement.style.border = '.5px solid transparent'
        fakeBody.appendChild(testElement)
        docEl.appendChild(fakeBody)
        if (testElement.offsetHeight === 1) {
        docEl.classList.add('hairlines')
        }
        docEl.removeChild(fakeBody)
    }

    setTimeout(() => {
        $('#loading-container').fadeOut();
    }, 2000);

    $('#mck-menu__collapse').click(function() {
        var menu = $('.mck-menu__normal');
        if (menu.hasClass('opened')) {
            $(this).removeClass('opened')
            menu.removeClass('opened')
        } else {
            $(this).addClass('opened')
            menu.addClass('opened')
        }
    })
    
    // 轮播图
    var currentIndex = 0;
    var announceList = <%- get_announce(config) %>
    setInterval(function () {
        var currentItem = announceList[currentIndex];
        $('.mck-announce-single').removeClass('mck-announce-single--active');
        $('.mck-announce-main-title').text(currentItem.title);
        $('.mck-announce-subtitle').text(currentItem.desc);

        $('.mck-announce-single').eq(currentIndex).addClass('mck-announce-single--active');
        currentIndex++;
        if (currentIndex > announceList.length - 1) {
            currentIndex = 0
        }
    }, 3000);
})

