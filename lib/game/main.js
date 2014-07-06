ig.module( 
	'game.main' 
)
.requires(
    //'impact.debug.debug',
	'impact.game',
	'impact.font',
    'plugins.simple-camera',
    'game.entities.player',
    'game.entities.knight',
    'game.entities.wizard',
    'game.levels.area1'
)
.defines(function(){
    
    //
    // --------------------------------------------------------------------------
    // The Game Stage
    // --------------------------------------------------------------------------
    //
    GameStage = ig.Game.extend({
        
        clearColor: '#000000',
        isPaused: false,
        tileSize: 5,
        gravity: 400,
        
        // initialize your game here
        init: function() {
            
            // bind keys
            ig.input.bind( ig.KEY.A, 'left' );
            ig.input.bind( ig.KEY.D, 'right' );
            ig.input.bind( ig.KEY.C, 'invincible' );
            ig.input.bind( ig.KEY.P, 'pause' );
            ig.input.bind( ig.KEY.MOUSE1, 'click' );
            
            this.loadLevel( LevelArea1 );
            
            // show collision boxes
            //ig.Entity._debugShowBoxes = true;
            
            // set game width
            this.resizeGame();
        },
        
        update: function() {
            this.parent();
            
            if ( ig.input.pressed('pause') ) {
                this.isPaused = !this.isPaused;
            }
            
            if ( ig.game.isPaused ) {
                return;
            }
            
            // update camera
            if ( this.player ) {
                if ( this.camera ) {
                    // camera follows the player
                    this.camera.follow( this.player );
                } else {
                    // center screen on the player
                    this.screen.x = ( this.player.pos.x - ( ig.system.width / 2 ) );
                    this.screen.y = ( this.player.pos.y - ( ig.system.height / 2 ) );
                }
            }
            
        },
        
        draw: function() {
            this.parent();
        },
        
        loadLevel: function( data ) {
            
            // remember the currently loaded level, so we can reload when the player dies.
            this.currentLevel = data;
            
            // call the parent implemenation. this creates the background maps and entities.
            this.parent( data );
            
            // setup camera plugin
            this.camera = new ig.SimpleCamera();
            this.camera.offset.x.min = 0;
            this.camera.offset.x.max = 0;
            this.camera.getMinMax();
            
            // spawn knight
            ig.game.spawnEntity( EntityKnight, ( this.tileSize * 60 ), ( this.tileSize * 56 ) );
            
            // spawn wizard
            ig.game.spawnEntity( EntityWizard, ( this.tileSize * 65 ), ( this.tileSize * 56 ) );
            
            // spawn player
            ig.game.spawnEntity( EntityPlayer, ( this.tileSize * 10 ), ( this.tileSize * 56 ) );
        },
        
        // size the game to the browser
        resizeGame: function() {
            
            // has the game started
            if ( ! ig.system ) {
                return;
            }
            
            // resize the canvas
            if ( canvas ) {
                console.log(window.innerWidth, scale);
                canvas.style.width = window.innerWidth + 'px';
                canvas.style.height = window.innerHeight + 'px';
                ig.system.resize( window.innerWidth * scale, window.innerHeight * scale );
            }
            
            if ( this.camera ) {
                this.camera.getMinMax();
            }
        },
        
    });
    
    
    
    //
    // --------------------------------------------------------------------------
    // Fullscreen / Mobile mode
    // --------------------------------------------------------------------------
    //
    
    // If our screen is smaller than 640px in width (that's CSS pixels), we scale the 
    // internal resolution of the canvas by 2. This gives us a larger viewport and
    // also essentially enables retina resolution on the iPhone and other devices 
    // with small screens.
    var scale = 1;//(window.innerWidth < 640) ? 2 : 1;
    
    if ( fullscreen || ig.ua.mobile ) {
        // We want to run the game in "fullscreen", so let's use the window's size directly as the canvas' style size.
        var canvas = document.getElementById('canvas');
        canvas.style.width = window.innerWidth * scale + 'px';
        canvas.style.height = window.innerHeight *scale + 'px';
        
        // If we're running on a mobile device and not within Ejecta, disable sound completely :(
        //if( ! window.ejecta ) {
            //ig.Sound.enabled = false;
        //}
        
        // on browser resize, update the canvas and game entities
        window.addEventListener('resize', function(){
            if ( ! ig.system ) {
                return;
            }
            ig.game.resizeGame();
        }, false);
    }
    
    
    //
    // --------------------------------------------------------------------------
    // Initialize the Game
    // --------------------------------------------------------------------------
    //
    //var width = window.innerWidth * scale;
    //var height = window.innerHeight * scale;
    if ( fullscreen || ig.ua.mobile ) {
        ig.main( '#canvas', GameStage, 1, 300, 180, 1 );
    } else {
        ig.main( '#canvas', GameStage, 1, 300, 180, 3 );  
    }
});
