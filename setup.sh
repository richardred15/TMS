echo
echo
has_node=true
type node >/dev/null 2>&1 || { has_node=false; }
if $has_node ; then
    apache=true
    nginx=true
    type apache22 >/dev/null 2>&1 || apache=false
    type nginx2 >/dev/null 2>&1 || nginx=false
    if ! $nginx && ! $apache ; then
        echo -e "   \033[31mNo web server found, html pages may not be served!\e[0m"
        echo
        sleep 2
    fi
    node_ver_raw=$(node -v)
    node_ver=$(node -v | tr -d '.v')
    if [ $node_ver -lt "1200" ]; then
        echo Node $node_ver_raw Too Old!
    else
        node setup.js
    fi
else
    echo -e "   \033[31mNode Installation Not Found... Exiting!\e[0m"
fi