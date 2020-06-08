#!/bin/bash          
function finish {
      clear
      if $created ; then
            echo
            type node >/dev/null 2>&1 || { echo -e >&2 "   \033[31mTMS requires NodeJS!\e[0m"; echo; }
            apache=true
            nginx=true
            type apache2 >/dev/null 2>&1 || apache=false
            type nginx >/dev/null 2>&1 || nginx=false
            if ! $nginx && ! $apache ; then
                  echo -e "   \033[31mNo web server found, html pages may not be served!\e[0m"
                  echo
            fi
            echo -e "   Copy \033[33m./config.json\e[0m to \033[33m./server/config.json\e[0m if it is correct"
            echo
            echo -e "   To start the server on port \e[36m$port\e[0m run \033[35mnode server/server.js\e[0m"
            echo
            echo -e "   Your admin panel is accessible at \033[32m$url$path/admin\e[0m"
            echo
            echo -e "   Clients can connect to the default panel at \033[32m$url$path/client\e[0m"
            echo -e "      Copy contents of \033[33m./client\e[0m folder to"
            echo -e "         this directory to make client url \033[32m$url$path/"
            echo
      fi
      echo -e "   \e[33m
             ___                     __     
              | |__| /\ |\ ||_/  \_//  \/  \\
              | |  |/--\| \|| \   | \__/\__/
                               \e[0m"
}

created=false
trap finish EXIT
clear

re='^[0-9]+$'
request="   Please Enter"
url="http://"

echo -e "   \033[31m============================================================"
echo -e "   ==   @@@@@@@@@@@@@@  |||\\\\\\        ///|||   |||@@@@@|||   =="
echo -e "   ==        @@@        ||| \\\\\\      /// |||   |||           =="
echo -e "   ==        @@@        |||  \\\\\\    ///  |||   |||@@@@@|||   =="
echo -e "   ==        @@@        |||   \\\\\\  ///   |||           |||   =="
echo -e "   ==        @@@        |||    \\\\\\///    |||           |||   =="
echo -e "   ==        @@@        |||             |||   |||@@@@@|||   =="
echo -e "   ============================================================"
echo -e "                     ___ __  __  _ ___ _  __ "
echo -e "                    / _//__\|  \| | __| |/ _]"
echo -e "                   | \_| \/ | | ' | _|| | [/\\"
echo -e "                    \\__/\\__/|_|\\__|_| |_|\\__/\e[0m"
echo 
echo

function get_port {
      read -p "$request SMTP port (enter for 587):  " smtp_port
      if [ "$smtp_port" = "" ]
      then
            smtp_port=587
      fi
      if ! [[ $smtp_port =~ $re ]] ; then
            echo -e "   \033[31mERROR: $smtp_port is not a Number\e[0m"
            get_port
      fi
}

function get_host {
      read -p "$request hostname e.g. richard.works:  " host
      if [ "$host" = "" ] ; then
            echo "   Hostname cannot be blank!"
            get_host
            return 0
      fi
      if [ "${host: -1}" = "/" ] ; then
            host=${host:0:-1}
      fi
}

function enable_https {
      read -p "   Enable HTTPS [y/n] (enter for yes):  " https
      https="$(echo $https | tr '[:upper:]' '[:lower:]')"
      if [ "$https" = "" ]
      then
            https="y"
      fi
      if ! [ "$https" = "y" ] && ! [ "$https" = "n" ]
      then
            echo "   $request Y or N"
            enable_https
            return 0
      fi
      if [ "$https" = "y" ]
      then
            read -p "   Path to Key File:  " https_key
            read -p "   Path to Certificate File:  " https_cert
            read -p "   Path to Chain File:  " https_ca
            url="https://$host"
      else
            url="http://$host"
      fi

}
get_host
read -p "$request NodeJS server port (enter for 3009):  " port
if [ "$port" = "" ] ; then
      port=3009
fi
read -p "$request url path e.g. /projects/TMS (enter for /):  " path
if [ "${path: -1}" = "/" ] ; then
      path=${path:0:-1}
fi
read -p "$request AES 256 bit key (enter for auto):  " key
if [ "$key" = "" ] ; then
      key=$(cat /dev/urandom | tr -dc 'a-zA-Z0-9\/.,<>;":-=_+[]{}' | fold -w 32 | head -n 1)
fi
read -p "$request SMTP host (enter to disable email):  " smtp_host
if [ -z "$smtp_host" ]
then
      echo "   Email Disabled"
      smtp_port=1
else
      get_port
      read -p "$request email FROM address (enter for 'No Reply' <no-reply@$host>):  " from_email
      if [ "$from_email" = "" ] ; then
            from_email="'No Reply' <no-reply@$host>"
      fi
      read -p "$request SMTP user (enter for none):  " smtp_user
      read -p "$request SMTP pass (enter for none):  " smtp_pass
fi



enable_https


text="\t{\n
\t\"algorithm\": \"aes-256-ctr\",\n
\t\"key\":\"$key\",\n
\t\"mail\": {\n
\t\t\"host\": \"$smtp_host\",\n
\t\t\"port\": $smtp_port,\n
\t\t\"user\": \"$smtp_user\",\n
\t\t\"pass\": \"$smtp_pass\"\n
\t},\n
\t\"from\": \"$from_email\",\n
\t\"host\": \"$url\",\n
\t\"port\": \"$port\",\n
\t\"path\": \"$path\",\n
\t\"https\": {\n
\t\t\"key\": \"$https_key\",\n
\t\t\"cert\": \"$https_cert\",\n
\t\t\"ca\": \"$https_ca\"\n
\t}\n
\t}"

echo -e "   \033[32mPlease Review the Following Configuration:\e[0m"
echo
echo -e $text
echo
echo -e "   \033[31mPress enter to save OR ctrl-c to cancel\e[0m"
read -p "" cancel
if [ "$cancel" = "" ]
then
      echo -e $text > config.json
      echo "FILE SAVED TO ./config.json"
      created=true
else
      echo -e "\e[0mCanceling, goodbye"
fi