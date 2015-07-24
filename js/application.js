/**
* jQuery initialization
*/
$(document).ready(function() {
  $('#disconnect').click(helper.disconnect);
  $('#signOut').click(helper.signOut);
  $('#loaderror').hide();
  
  if ($('meta')[0].content == 'YOUR_CLIENT_ID') {
    alert('This sample requires your OAuth credentials (client ID) ' +
        'from the Google APIs console:\n' +
        '    https://code.google.com/apis/console/#:access\n\n' +
        'Find and replace YOUR_CLIENT_ID with your client ID.'
    );
  };
  
  $('#visibility').change(function(){
      if(this.value != ""){
        helper.fetchAlbums();
      } else {
        $('#albums').html('');
        $('#albums').hide();
        $('#photos').html('');
        $('#photos').hide();
        $('#photoZoom').html('');
        $('#photoZoom').hide();
      }
  });
});

var helper = (function() {
  return {
    /**
     * Hides the sign in button and starts the post-authorization operations.
     *
     * @param {Object} authResult An Object which contains the access token and
     *   other authentication information.
     */
    onSignInCallback: function(authResult) {
      
      if (authResult.isSignedIn.get()) {
        $('#authOps').show('slow');
        $('#gSignInWrapper').hide();        
        
      } else if (authResult['error'] ||
          authResult.currentUser.get().getAuthResponse() == null) {
        // There was an error, which means the user is not signed in.
        // As an example, you can handle by writing to the console:
        console.log('There was an error: ' + authResult['error']);
        $('#authResult').append('Logged out');
        $('#authOps').hide('slow');
        $('#gSignInWrapper').show();
      }

      console.log('authResult', authResult);
      console.log('authResult currentUser', authResult.currentUser);
      console.log('authResult currentUser get()', authResult.currentUser.get());
      console.log('authResult currentUser get() getAuthResponse()', authResult.currentUser.get().getAuthResponse());
    },

    signOut: function() {
      auth2.signOut();  
      helper._resetDataPanel();    
    },
    /**
     * Calls the OAuth2 endpoint to disconnect the app for the user.
     */
    disconnect: function() {
      // Revoke the access token.
      auth2.disconnect();
      helper._resetDataPanel();
    },

    _resetDataPanel: function() {
      $('#gSignInWrapper').show();
      $('#authOps').hide();
      $('#albums').html('');
      $('#photos').html('');
    },
    /**
    * Fetches albums data
    */
    fetchAlbums: function() {     
      console.log("auth2", auth2);
      var googleUser = auth2.currentUser.get();
      console.log("googleUser", googleUser);
      var profile = googleUser.getBasicProfile();
      console.log("profile",profile);
      console.log("User ID", profile.getId());
      var visibility = $('#visibility').val();
      var googleAPI = "https://picasaweb.google.com/data/feed/api/user/"+profile.getId()+"?access_token="+auth2.currentUser.get().getAuthResponse().access_token+"&kind=album&access="+visibility+"&alt=json";         
      
      $.ajax({
        url: googleAPI,
        dataType: "jsonp",
        timeout: 5000,

        success: function (parsed_json) {
          console.log('Parsed JSON', parsed_json);
          var entryCount = parsed_json.feed.entry.length;
          var albumList = '<div class="data-caption">'+entryCount+' albums loaded.</div><br/><ul class="shrUPFC shrRH">';
          for(var i=0; i< entryCount; i++) {
              var entry = parsed_json.feed.entry[i];
              var title = entry.title.$t;
              var albumVisibility = entry.gphoto$access.$t;
              var albumThumbnail = entry.media$group.media$thumbnail[0].url+"?access_token="+auth2.currentUser.get().getAuthResponse().access_token;;
              var count = entry.gphoto$numphotos.$t;
              var albumLink = entry.link[0].href+"&access_token="+auth2.currentUser.get().getAuthResponse().access_token;
              albumList += '<li tabindex="0" onclick="helper.fetchAlbumData(\''+albumLink+'\')" class="shrUPAlbum"><div class="shrUPStack shrUPStack8"><img style="background-image:url('+albumThumbnail+'), url(images/loading.gif);"></div><div>'+title+'('+count+')</div></li>';
          }
          albumList += '</ul>';
          $('#albums').hide();
          $('#photos').hide();
          $('#photoZoom').hide();
          $('#albums').html(albumList);
          $('#albums').show('slow');
        },

        error: function (parsedjson, textStatus, errorThrown) {
          console.log("parsedJson: " + JSON.stringify(parsedjson));
          console.log("parsedJson status:", parsedjson.status);
          console.log("errorStatus:", textStatus);
          console.log("errorThrown:", errorThrown);         
        }
      });
    },
    fetchAlbumData: function(albumLink) {
       $.ajax({
        url: albumLink,
        dataType: "jsonp",
        timeout: 5000,

        success: function (parsed_json) {
          console.log('Parsed Album JSON Data', parsed_json);
          var entryCount = parsed_json.feed.entry.length;
          var photoList = '<div class="data-caption">'+entryCount+' items loaded.</div><br/><ul class="shrUPFC shrRH" style="height: 542px;">';
          for(var i=0; i< entryCount; i++) {
            var entry = parsed_json.feed.entry[i];
            var photoThumbnail = entry.media$group.media$thumbnail[1].url+"?access_token="+auth2.currentUser.get().getAuthResponse().access_token;
            var photoLink = entry.link[0].href+"&access_token="+auth2.currentUser.get().getAuthResponse().access_token;
            photoList += '<li onclick="helper.fetchPhotoData(\''+photoLink+'\')" class=""><div><div><div><img tabindex="0" onload="" class="" src="'+photoThumbnail+'"></div></div></div></li>';
          }
          photoList += '</ul>';
          $('#albums').hide();
          $('#photos').hide();
          $('#photoZoom').hide();
          $('#photos').html(photoList);
          $('#photos').show('slow');
        },

        error: function (parsedjson, textStatus, errorThrown) {
          console.log("parsedJson: " + JSON.stringify(parsedjson));
          console.log("parsedJson status:", parsedjson.status);
          console.log("errorStatus:", textStatus);
          console.log("errorThrown:", errorThrown);        
        }
      });
    },
    fetchPhotoData: function(photoLink) {
      photoLink += "&imgmax=1024";
      console.log("Photo Link", photoLink);
      $.ajax({
        url: photoLink,
        dataType: "jsonp",
        timeout: 5000,

        success: function (parsed_json) {
          console.log('Parsed Photo JSON Data', parsed_json);
          var photoUrl = parsed_json.feed.media$group.media$content[0].url;          
          $('#albums').hide();
          $('#photos').hide();
          $('#photoZoom').html('<br/><button onclick="helper.minimizeItem()">Minimize</button><br/><img tabindex="0" src="'+photoUrl+'">');                    
          $('#photoZoom').show('slow');
        },

        error: function (parsedjson, textStatus, errorThrown) {
          console.log("parsedJson: " + JSON.stringify(parsedjson));
          console.log("parsedJson status:", parsedjson.status);
          console.log("errorStatus:", textStatus);
          console.log("errorThrown:", errorThrown);        
        }
      });
    },
    minimizeItem : function() {
      $('#photoZoom').hide();
      $('#photos').show('slow');
      $('#photoZoom').html('');
    }
  };
})();

/**
* Handler for when the sign-in state changes.
*
* @param {boolean} isSignedIn The new signed in state.
*/
var updateSignIn = function() {
console.log('update sign in state');
attachSignin(document.getElementById('customBtn')); 
if (auth2.isSignedIn.get()) {
  console.log('signed in');    
}else{
  console.log('signed out');    
}
helper.onSignInCallback(gapi.auth2.getAuthInstance());
}

function startApp() {
  gapi.load('auth2', function(){
    // Retrieve the singleton for the GoogleAuth library and set up the client.
    auth2 = gapi.auth2.init({        
      cookiepolicy: 'single_host_origin',
      // Request scopes in addition to 'profile' and 'email'
      scope: 'https://picasaweb.google.com/data/',
      fetch_basic_profile : true
    }).then(
          function (){
            console.log('init');
            auth2 = gapi.auth2.getAuthInstance();
            auth2.isSignedIn.listen(updateSignIn);
            auth2.then(updateSignIn());
          });  
  });    
};

/**
* Attach Google Sign-in to custom button.
*/
function attachSignin(element) {
  console.log(element.id);
  console.log('auth2', auth2);
  if(auth2) {
    auth2.attachClickHandler(element, {}, {}, 
      function(error) {
          alert(JSON.stringify(error, undefined, 2));
      }
    );
  }
}