#!/bin/bash          
function finish {
      clear
      echo -e "\e[33mTHANK YOU FOR USING TMS CONFIG\e[0m"
}
open=false
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
read -p "$request hostname e.g. richard.works:  " host
read -p "$request url path e.g. /projects/TMS:  " path
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


text="{\n
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
\t\"path\": \"$path\",\n
\t\"https\": {\n
\t\t\"key\": \"$https_key\",\n
\t\t\"cert\": \"$https_cert\",\n
\t\t\"ca\": \"$https_ca\"\n
\t}\n
}"

echo -e "\033[32mPlease Review the Following Configuration:\e[0m"
echo
echo -e $text
echo
echo -e "\033[31mPress enter to save OR ctrl-c to cancel\e[0m"
read -p "" cancel
if [ "$cancel" = "" ]
then
      echo -e $text > config.json
      echo "FILE SAVED TO ./config.json"
      open=true
else
      echo -e "\e[0mCanceling, goodbye"
fi