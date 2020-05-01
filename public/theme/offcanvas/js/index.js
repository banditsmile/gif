;(function(global, $,Dialog) {
    var list_url = 'http://gif.series.ink/index.php?action=list';
    var search_sensitive_words_url = 'http://admin.xl9.xunlei.com/sensitive_words/search';
    var sensitive_words_action = 'http://admin.xl9.xunlei.com/sensitive_words/action';
    var danmaku_action = 'http://admin.xl9.xunlei.com/danmaku/action';
    var Controller = {
        init: function () {
            this.initUI();
            this.bindEventHandlers();
        },

        bindEventHandlers: function () {
            var $com_box = $('div.com_box');
            $com_box.on('click', 'th input:checkbox', this.checkAll);
            $com_box.on('click', 'td input:checkbox', this.unCheck);
            $('a.sea').on('click',this.searchEvent);
            $('a.export').on('click',this.export_data);
            $('#msg-box').on('click','.close',this.close_msg_tips);
            $('div.page').on('click','a',this.runPage);
            $("div.tab_com a").click(function(){
                $(this).addClass("cur").siblings().removeClass("cur");
                var i = $(this).index();
                $(".com_main").find(".com_box").eq(i).css("display","block").siblings().css("display","none");
                Controller.searchData(0,i);
            });
            $('table.tb_com').on('click','a.action',this.itemAction);
            $('div.title').on('click','a.action',this.batchAction);
        },

        initUI: function () {
            Controller.searchData(0,0);
        },

        itemAction:function(event){
            var param = {
                'id':$(event.target).data('no'),
                'status':$(event.target).data('action')
            };
            var url = $('div.tab_com a.cur').index()<3 ? danmaku_action:sensitive_words_action;
            $.ajax({url: url, data: param, type: 'POST'})
                .done(function (data) {
                    var msg = (data.errno == 0) ? '操作成功' : data.content;
                    Dialog.info(msg);
                }).always(function () {
                Dialog.loading_stop();
            });
        },
        checkAll: function (event) {
            var item_value = $(event.target).attr("checked") ? "checked" : false;
            $(event.target).closest('tr').siblings().each(function(i,n){
                $(n).find('input:checkbox').attr("checked", item_value);
            })
        },
        unCheck: function (event) {
            if(!$(event.target).attr("checked")){
                $(event.target).closest('table').find('th input:checkbox').attr("checked",false);
            }
        },
        //批量操作
        batchAction:function(event){
            var ids = [];
            var tab_id = $('div.tab_com a.cur').index();

            var $search_box = $('div.com_box:eq('+tab_id+')');
            var $checked_items = $search_box.find('tr:gt(0) input:checked');
            $checked_items.each(function (i, n) {
                ids.push($(n).val());
            });
            var param = {
                'id':ids.toString(),
                'status':$(event.target).data('action')
            };
            var url = tab_id<3 ? danmaku_action:sensitive_words_action;
            $.ajax({url: url, data: param, type: 'POST'})
                .done(function (data) {
                    var msg = (data.errno == 0) ? '操作成功' : data.content;
                    Dialog.info(msg);
                }).always(function () {
                Dialog.loading_stop();
            });
        },

        searchEvent:function(event){
            var tab_id = $('div.tab_com a.cur').index();
            Controller.searchData(0,tab_id);
        },
        //搜索内容
        searchData: function(offset,tab_id){
            var tab_name = ['waiting_tab','allowed_tab','deleted_tab','sensitive_words_tab'];
            tab_id = tab_id||$('div.tab_com a.cur').index();
            offset = offset||1;
            var $search_box = $('div.com_box:eq('+tab_id+')');
            var search = {
                nickname:$search_box.find('input[name=nickname]').val(),
                userid:$search_box.find('input[name=userid]').val(),
                "word":$search_box.find('input[name=word]').val(),
                "editor":$search_box.find('input[name=editor]').val(),
                "update_time":$search_box.find('input[name=update_time]').val(),
                "time":$search_box.find('input[name=time]').val(),

                "category":$search_box.find('select[name=category]').val(),
                "start_time":$search_box.find('input[name=start_time]').val(),
                "end_time":$search_box.find('input[name=end_time]').val(),

                "limit":10,
                "offset":offset,
                "status":tab_id
            };

            Dialog.loading('搜索中');
            var request_url = tab_id<3 ? search_danmaku_url : search_sensitive_words_url;
            $.ajax({url: request_url, data: search, type: 'POST'})
                .done(function (data) {
                    if (data.errno == 0 ) {
                        var $tab = $('#'+tab_name[tab_id]);
                        if( data.data.length > 0){
                            $tab.find('tr:gt(0)').remove();
                            var temp_name = tab_id <3 ? 'danmaku-tpl':'sensitive_words-tpl';
                            var template = _.template($('#'+temp_name).html());
                            $tab.find('tr:eq(0)').after(template(data));
                            $('div.no_result').hide();
                        }else{
                            $tab.find('tr:gt(0)').remove();
                            $tab.next('div.no_result').show();
                        }
                        //生成分页代码
                        Controller.renderPagination(data.count,search.offset,search.limit);
                    } else {
                        Dialog.info(data.content);
                    }
                }).fail(function () {
                Dialog.info('系统错误,请稍后重试');
            }).always(function () {
                Dialog.loading_stop();
            })
            ;
        },
        /**
         * 生成分页标签
         * @param total int 总记录数
         * @param offset int 当前页码
         * @param limit int  每页长度
         */
        renderPagination:function(total,offset,limit){
            offset = parseInt(offset);
            var tab_id = tab_id||$('div.tab_com a.cur').index();
            var $page_div = $('div.page:eq('+tab_id+')');
            $page_div.html('').hide();
            var pagination_list = '';
            var max_page = Math.ceil(total/limit);
            if(max_page<2){return ;}

            //向前三页
            for(var page=offset-1;(page>=1) && (page>=(offset-3));page--){
                pagination_list = '<a href="javascript:;">'+page+'</a>'+pagination_list;
            }
            if(page >=1){
                pagination_list = '<a href="javascript:;">1</a>'+pagination_list;
            }

            //当前页
            pagination_list = pagination_list+'<a href="javascript:;" class="cur">'+offset+'</a>';

            //向后三页
            for(page=offset+1; (page<=max_page) && (page<=(offset+3));page++){
                pagination_list = pagination_list+'<a href="#">'+page+'</a>';
            }
            if(page <=max_page){
                pagination_list = pagination_list+'<a href="javascript:;">'+max_page+'</a>';
            }
            $page_div.html(pagination_list).show();
        },

        runPage:function(event){
            $('div.page').hide();
            var offset = $(event.target).html();
            Controller.searchData(offset,$('div.tab_com a.cur').index());
        }
    };
    //页面入口
    Controller.init();
})(window, jQuery,Dialog);