$(document).ready(function () {
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